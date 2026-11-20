# CLAUDE.md

Save App ("Collections") is a personal memory app. Users keep **Collections**, which are ordered lists of typed **Cards**, and can ask a chat bot about them using RAG (pgvector search plus a local LLM). It runs as a web app and as an Android app (Capacitor). Android's share sheet sends items into an "inbox" collection.

## Repository layout

| Path | What it is | Stack |
|---|---|---|
| `SaveApp.AppHost/` | Local orchestrator. Starts every service below. | .NET Aspire 13.6 (net10.0) |
| `CollectionsDB/` | Backend REST API + RAG. Project/assembly name is `CollectionsService`. | ASP.NET Core 10, EF Core + Npgsql + pgvector, OllamaSharp |
| `SaveAppGateway/` | API gateway: validates the JWT, then proxies `/api/**` to the backend. | Spring Boot 4.1 / Spring Cloud Gateway (WebFlux), Java 25, Gradle |
| `SaveApp-UI/` | Frontend monorepo: `save-app-web` and `save-app-mobile` apps plus shared libs. | Nx 19, Angular 18, Capacitor 8, Jest |
| `CollectionsArchitecture/` | draw.io architecture diagram | |
| `.agents/skills/` | Aspire agent skills (aspire, aspireify, aspire-deployment, …) | |

`Collections.slnx` contains only the two .NET projects. The root `package.json` only adds `@aparajita/capacitor-secure-storage`. The real JS workspace is `SaveApp-UI/`.

## Request flow

```
Angular (web :4200 / Capacitor Android)
   │  Bearer <Keycloak JWT>
   ▼
SaveAppGateway (:8000)  ── validates JWT against Keycloak JWKS (allowed issuers list)
   │  strips client X-Profile, sets X-Profile: {"id": <sub>, "name": <name|preferred_username>}
   ▼
CollectionsService (/api/Collections, /api/RAG)
   │  CurrentUser reads X-Profile → UserId
   ▼
Postgres + pgvector (custom image)      Ollama (nomic-embed-text, qwen3:8b)
```

- **Multi-tenancy lives in `CollectionsDBContext`.** Global query filters scope `collections`, `cards` and `card_embeddings` to `ICurrentUser.UserId`, and `SaveChanges` stamps `UserId` on new rows. Repositories never filter by user themselves. Don't add per-query user filters, and don't bypass the filters (`IgnoreQueryFilters`) without a good reason.
- Code with no HTTP request (e.g. consumers) resolves `IUserContext` in its own scope and calls `Set(userId)`. Don't bypass the filters.
- `CurrentUser.UserId` **throws `UnauthorizedAccessException` when no `X-Profile` header is present.** Calling the backend directly (Swagger, curl) without that header fails on any DB access. Pass a header such as `X-Profile: {"id":"dev","name":"dev"}`.
- With gateway security off (`APP_SECURITY_ENABLED=false`), the gateway *removes* `X-Profile`, so DB calls through it fail as well.

## Running locally

The normal path is Aspire from the repo root (`aspire.config.json` points at the AppHost):

```bash
aspire run          # or: dotnet run --project SaveApp.AppHost
```

The AppHost starts:
- `postgres` from the **local image `postgres-vector:latest`**. Build it once with `docker build -f CollectionsDB/Dockerfile.postgres -t postgres-vector CollectionsDB`. pgAdmin is included.
- `ollama` (persistent container + volume) with the models `nomic-embed-text` and `qwen3:8b`.
- `collections-service`, which receives the connection string and `Embedding__*` / `Llm__*` env vars.
- `keycloak` on 8443, importing `SaveApp.AppHost/Realms/save-app-realm.json` (realm `save-app`, clients `save-app-ui` and `save-app-mobile`).
- `gateway` through `./gradlew bootRun` in `SaveAppGateway/` on port 8000 with Spring profile `dev`. That profile trusts `SaveAppGateway/certs/keycloak-dev.pem`.
- The `save-app-web` Nx app on https 4200, run with `-c aspire`. **`npm install` is not run** (`install: false`), so run `npm install` in `SaveApp-UI/` yourself first.

AppHost config (`SaveApp.AppHost/appsettings.json` → `App`): `AuthenticationEnabled`, `Realm`, `KeycloakUrl`, `KeycloakPublicUrl` (Tailscale host), `IsPersistent`. When `IsPersistent` is true, Postgres and Keycloak get data volumes. Otherwise the data is thrown away on every run.

## Commands

### Backend (`CollectionsDB/`)
```bash
dotnet build
dotnet run                                   # Swagger at /swagger in Development
dotnet tool restore                          # dotnet-ef 10.0.14 (local tool manifest)
dotnet ef migrations add <Name> -o Persistence/Migrations
```
Migrations are applied automatically at startup (`db.Database.Migrate()` in `Program.cs`). There is no .NET test project.

### Gateway (`SaveAppGateway/`)
```bash
./gradlew bootRun
./gradlew test
```

### Frontend (`SaveApp-UI/`)
```bash
npm install
npx nx serve save-app-web                    # dev config → environment.local.ts (auth disabled), https, proxies /api → localhost:8000
npx nx serve save-app-web -c aspire          # environment.aspire.ts (Keycloak at keycloak-collections.dev.localhost:8443)
npx nx serve save-app-mobile
npx nx test <project>                        # e.g. data-access, feature-cards, ui
npx nx test <project> --testFile=<file.spec.ts>
npx nx lint <project>
npx nx build save-app-mobile && npx cap sync android   # run cap from apps/save-app-mobile
```
Nx projects: `save-app-web`, `save-app-mobile`, `data-access`, `feature-cards`, `feature-chat`, `feature-collections`, `feature-inputs`, `feature-security`, `ui`. `libs/shared/models` (`@save-app/models`) is only a tsconfig path alias with no `project.json`.

Formatting: Prettier with `singleQuote: true`.

## Backend structure (`CollectionsDB/`)

Layered, namespace `CollectionsDB.*`:
- `Api/Controllers`: `CollectionsController` (`api/Collections`) and `RAGController` (`api/RAG`).
- `Api/Contracts` + `Api/Mapping/CollectionMapper`: request/response DTOs. Map them to domain objects at the controller.
- `Application/`: `CollectionsService` (creates embeddings on card create/update; embedding failures are logged and the card is still saved without one), `RagService`, `ICurrentUser`.
- `Domain/`: `Collection`, `Card` (`Value` is a `JsonElement?` stored as `jsonb`; `CardType` is stored as a string), `CardEmbedding` (separate table, `vector(768)`, cascade delete).
- `Persistence/`: `CollectionsDBContext`, `EfCollectionsRepository`, migrations.
- `Services/Embeddings/EmbeddingService`: OpenAI-compatible `/v1/embeddings`. Uses the nomic prefixes `search_document:` and `search_query:`.
- `Services/Llm/OllamaCardAnswerService`: streams the answer. Its system prompt treats memory text as untrusted data.

API notes:
- Collection IDs are 36-character GUID strings created **by the client**. Routes use `{id:length(36)}`.
- Card endpoints are `POST` / `PUT` / `DELETE` on `api/Collections/{id}/Cards`. DELETE takes the body `{ cardId }`. PUT updates content only and never changes `Position`.
- `PUT api/Collections/{id}/Cards/order` with `{ cardIds }` reorders a collection: each card's `Position` becomes its index. On the client: `CollectionsFacade.reorderCards` → outbox `reorderCards` change (full ordered list) → one request.
- **Inbox:** each user has one `Collection.Kind = INBOX`, with ID `InboxId.For(userId)` (UUIDv5). `EnsureInboxAsync` creates it lazily and adopts the old shared `inbox000…` collection. It is pinned first, the server ignores any `Kind` sent by the client, and DELETE on it is a no-op returning 204.
- `POST api/Collections/inbox` takes `{ text, key?, type }` from the Android share receiver and writes to the user's inbox.
- `POST api/Collections/{targetId}/Cards/{cardId}/move` moves a card while keeping its ID and embedding. It is idempotent. On the client: `CollectionsFacade.moveCard` → outbox `moveCard` change.
- `POST api/RAG/search` takes a **bare JSON string** as the body (custom `SearchCardsRequestConverter`). It responds with SSE events: `cards` (JSON array), then several `token` events, then `done`, or `error` on failure. Search takes the top 10 by cosine distance, keeps those with distance ≤ 0.5, and returns at most 3.

## Frontend structure (`SaveApp-UI/`)

- **`data-access`**: `CollectionsFacade` is the API for components. It pins the inbox first (`inbox$`), refuses to delete it, and exposes `moveCard`. `provideDataAccess()` binds `CollectionsApi` to **`IndexedDBCollectionsDB` (local-first, the default)**, which keeps a local snapshot plus an **outbox** of queued changes. These are synced to `CollectionsDB` (the HTTP client, `REMOTE_COLLECTIONS_API`) in the background and on a 5-minute poll, but only while `canSync()` is true, i.e. the user is authenticated or auth is disabled. Unsynced state is exposed through `cardSynced$` / `hasUnsyncedChanges$`. New mutations should go through the facade → `CollectionsApi` so they get queued in the outbox.
- **`feature-cards` / `feature-inputs`**: each card type has a display component (`cardToComponentMap` in `registry/card-registry.ts`) and an input component (`inputToComponentMap` in `registry/input-registry.ts`), loaded dynamically by `CardType`. **To add a card type**, update the `CardType` enum in `libs/shared/models/src/lib/card.model.ts`, both registries, and the backend `CardType` and `CardTypeContract` enums. The enums must stay in the same order, because the type travels as a number.
- **`feature-collections`**: desktop collection views and `CollectionSelectionService`.
- **`feature-chat`**: `vector-search` chat UI. It calls the RAG endpoint with `fetch` (not `HttpClient`) to read the stream, so it attaches the token itself.
- **`feature-security`**: `AuthService` (keycloak-js). On web it uses `check-sso`. On native it uses a custom-scheme redirect `com.aviv.saveapp:/auth` through `@capacitor/browser`, stores tokens in Capacitor secure storage, and requests `offline_access`. `authInterceptor` adds the bearer token. `KEYCLOAK_CONFIG.enabled=false` turns auth off on the client.
- **`ui`**: shared presentational components and `ThemeService`.
- **Apps**: `save-app-web` (desktop view; environment files are swapped per build configuration) and `save-app-mobile` (`mobile-view-modern/*` components, swipe directive; `environments.ts` points at the Tailscale host `jellyfish.saola-agama.ts.net`). The native Android code is in `apps/save-app-mobile/android`. `ShareReceiverActivity.java` posts shared text to `/api/Collections/inbox`.

## Gotchas / known quirks

- On the client, card order is the order of the `cards` array. `Card.position` comes from the server and isn't sent back for ordering.
- The HNSW index is built with `vector_l2_ops`, but search uses `CosineDistance`, so Postgres won't use the index for that query.
- The `save-app-web` `test` target points at `apps/collections-mobile/jest.config.ts`, which doesn't exist. Use the per-lib test targets.
- `nx.json` uses the `nx-cloud` runner and contains an access token.
- CORS origins are defined in two places in the gateway (`spring.cloud.gateway…globalcors` and `app.cors.allowed-origins`), plus the Keycloak realm's redirect URIs. Update all of them when you add a frontend origin.
- `CollectionsDB/appsettings.json` defaults point at Docker Model Runner (`localhost:12434`). Under Aspire, env vars override them to point at Ollama.

## Documentation rule

Each project has a README covering its architecture and data models: [SaveApp-UI](SaveApp-UI/README.md), [SaveAppGateway](SaveAppGateway/README.md), [CollectionsDB](CollectionsDB/README.md) and [SaveApp.AppHost](SaveApp.AppHost/README.md). The root [README.md](README.md) links to all of them.

**After every significant change, update the affected README(s) and this CLAUDE.md in the same change.** Significant means a new or changed data model, entity or DB column; a new or changed API endpoint or contract; a new service, library or project; changes to the request or auth flow, the sync behavior, or a card type; and new required configuration or env vars. Keep the Mermaid diagrams accurate, and keep the explanations short: only the important models and architecture. If you add a new project, give it a README and link it from the root README.

## Conventions

- Commit messages use Conventional Commits (`feat:`, `fix:`, `refactor:`, …). See `CONTRIBUTING.md`.
- Keep PRs focused, and check that changes work on **both** desktop and mobile.
- Angular: standalone components, `inject()`, signals and RxJS. Libs are imported through the `@save-app/*` path aliases (`tsconfig.base.json`), never through relative paths across libs.
