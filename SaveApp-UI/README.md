# SaveApp-UI

An Nx 19 / Angular 18 monorepo. It contains the desktop web app and the Capacitor Android app, which share feature libraries.

## Architecture

```mermaid
flowchart TD
    subgraph apps
        WEB["save-app-web<br/>desktop view"]
        MOB["save-app-mobile<br/>mobile-view-modern + Capacitor Android"]
    end

    subgraph features
        FCOL[feature-collections]
        FCARD[feature-cards]
        FIN[feature-inputs]
        FCHAT["feature-chat<br/>RAG chat (SSE via fetch)"]
        FSEC["feature-security<br/>Keycloak AuthService + interceptor"]
    end

    UI["ui<br/>shared components, ThemeService"]
    DA["data-access<br/>CollectionsFacade + local-first sync"]
    M["shared/models<br/>@save-app/models"]

    apps --> features
    apps --> UI & DA
    FCOL --> FSEC & UI & DA
    FCARD --> UI & DA
    FIN --> FCOL & DA
    FCHAT --> FSEC & DA
    UI & DA --> M
    DA -->|"HTTP /api"| GW[SaveAppGateway]
```

Both apps use every library. `feature-security` doesn't depend on any other library. Libraries are imported through the `@save-app/*` aliases defined in `tsconfig.base.json`.

## Data models (`libs/shared/models`)

```mermaid
classDiagram
    class DBCollection {
        id: string
        title: string
        description: string
        emoji: string
        cards: Card[]
        kind?: NORMAL | INBOX
    }
    class Collection {
        id, title, description, emoji
        backgroundColor?
        kind?: NORMAL | INBOX
        collectionType (deprecated)
    }
    class Card {
        id: string
        key: string
        value?: unknown
        cardType: CardType
        isFavorite?, isArchived?
        order?: number
    }
    class CardType {
        <<enum>>
        SUBJECT
        STORY
        KEY_VALUE
        CHECKBOX
        LINK
        IMAGE
    }
    DBCollection "1" o-- "*" Card
    Card --> CardType
    DBCollection ..> Collection : facade maps to
```

- `DBCollection` has the same shape as the API data. `Collection` is the version used by the UI, without cards.
- `CardType` is sent over the wire as a **number**. Its order must match the backend `CardType` and `CardTypeContract` enums.
- The frontend uses `order` for card order, but the backend uses `position`.

## Card types: registry pattern

Each `CardType` has two components, which are looked up in maps and rendered dynamically:

| Map | Lib | Base class |
|---|---|---|
| `cardToComponentMap` | `feature-cards/registry/card-registry.ts` | `CardBuilderComponent` (displays a card) |
| `inputToComponentMap` | `feature-inputs/registry/input-registry.ts` | `InputBuilderComponent` (creates or edits a card) |

To add a card type: add it to the enum, then add a card component and an input component, register both, and update the backend enums.

## Data access: local-first sync

```mermaid
flowchart LR
    C[Components] --> F[CollectionsFacade]
    F --> API{{"CollectionsApi"}}
    API -->|"store: 'dexie'"| DX["DexieCollectionsDB<br/>tables: collections, cards, outbox"]
    API -->|"store: 'remote'"| REM
    DX -->|"sync: upload outbox, then fetch + merge"| REM["CollectionsDB<br/>HttpClient"]
    REM --> GW["/api/Collections"]
```

- The store and all sync options come from `environment.dataAccess` (`store`, `dbName`, `pollIntervalMs`, `unsyncedDebounceMs`, `syncOnOnline`, `syncOnVisible`), passed as `provideDataAccess(config, environment.dataAccess)`. Without a `store`, `provideDataAccess` uses `'dexie'`.
- **`DexieCollectionsDB`** (Dexie 4, `liveQuery`) keeps cards in their own table:

  | Table | Key / indexes | Row |
  |---|---|---|
  | `collections` | `id`, `position` | collection without `cards`, plus `position` (server order) |
  | `cards` | `id`, `collectionId`, `[collectionId+position]` | `{ id, collectionId, position, card: Card }` |
  | `outbox` | `++sequence` | queued change |

  The old hand-written IndexedDB store (cards embedded in their collection) was removed, with no migration. Its data lived under the same `dbName`, so clear the browser database on devices that ran it.
  DI tokens let you swap its dependencies: `COLLECTIONS_DEXIE` (the database), `INDEXED_DB` (the IndexedDB implementation, e.g. fake-indexeddb) and `SYNC_TRIGGERS` (the observable that starts background syncs).
- Each change is written to IndexedDB **and** added to the `outbox` in one transaction, so the UI updates immediately.
- A sync runs at startup, after every change, every `pollIntervalMs` (5 minutes), when the device comes back online, and when the tab becomes visible. It only runs while `canSync()` is true (the user is authenticated or auth is disabled).
- Sync uploads outbox entries in order and stops at the first failure. Each server call has a 30 s timeout (`SYNC_REQUEST_TIMEOUT_MS`), so a request that never settles can't wedge `syncInProgress`. Failures are logged as `[sync] …` in the console. Because a timed-out change may already be applied, the server's creates are idempotent. It then fetches the server copy and merges: **the server wins, except for collections that still have pending local changes**.
- `moveCard` updates both collections locally in one transaction and queues a single `moveCard` change. Both collections count as locally changed until it syncs.
- The server's inbox (`kind: 'INBOX'`) is pinned first by the facade (`inbox$`), and its delete control is hidden on desktop and mobile.
- `cardSynced$` and `hasUnsyncedChanges$` drive the "unsynced" indicators.
- `store: 'remote'` switches to calling the HTTP API directly.

## Auth (`feature-security`)

- **Web:** keycloak-js with `check-sso` and PKCE.
- **Native:** the login page opens in the system browser (`@capacitor/browser`) and redirects back to `com.aviv.saveapp:/auth`. Tokens, including the `offline_access` refresh token, are kept in secure storage.
- `authInterceptor` adds `Authorization: Bearer`. `KEYCLOAK_CONFIG.enabled=false` turns auth off.

## Mobile specifics

- Environment: `apps/save-app-mobile/src/environments/environments.ts` (Tailscale host).
- **Share sheet → inbox (offline, no app launch).** The share sheet starts native Java without a WebView, so it can't write to Dexie directly:

  ```mermaid
  sequenceDiagram
    participant S as Share sheet
    participant R as ShareReceiverActivity
    participant Q as ShareQueue (SharedPreferences)
    participant A as ShareInboxService (JS)
    participant F as CollectionsFacade / Dexie outbox
    S->>R: ACTION_SEND text
    R->>Q: add {id, text, type, url?, key?}
    R-->>S: toast "Saved" (no network, no token)
    Note over A: app start (after auth.init) / resume / inbox first known
    A->>Q: ShareInbox.getPending()
    A->>F: createCard(inboxId, draft) — normal insert
    A->>Q: ShareInbox.remove([id])
    F->>F: outbox syncs to the server when signed in + online
  ```

  - `ShareQueue.java` is the hand-off buffer, and `ShareInboxPlugin.java` (`ShareInbox`, registered in `MainActivity`) exposes `getPending()` / `remove(ids)`.
  - `src/app/share/share-inbox.service.ts` turns each item into a normal card: a link becomes `LINK` (key = host, value = URL), anything else becomes `SUBJECT` (key = text). Items wait in the queue until the inbox has been synced once.
  - A shared item reaches the server the next time the app opens or resumes. A true background upload (WorkManager) is not built yet.

## Commands

```bash
npm install
npx nx serve save-app-web               # auth off, /api -> localhost:8000
npx nx serve save-app-web -c aspire     # auth via Keycloak
npx nx serve save-app-mobile
npx nx test <project>                   # data-access, feature-*, ui
npx nx lint <project>
npx nx build save-app-mobile && (cd apps/save-app-mobile && npx cap sync android)
```
