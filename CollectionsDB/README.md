# CollectionsDB (CollectionsService)

The ASP.NET Core 10 backend. It stores users' collections and cards in Postgres, embeds each card with pgvector, and answers chat questions with RAG through a local Ollama model.

## Architecture

```mermaid
flowchart TD
    GW[SaveAppGateway] -->|"X-Profile header"| C

    subgraph Api
        C["CollectionsController<br/>/api/Collections"]
        R["RAGController<br/>/api/RAG"]
        CU["CurrentUser<br/>(reads X-Profile)"]
    end

    subgraph Application
        CSvc[CollectionsService]
        RSvc[RagService]
    end

    subgraph Persistence
        Repo[EfCollectionsRepository]
        Ctx["CollectionsDBContext<br/>per-user query filters"]
    end

    subgraph Services
        Emb["EmbeddingService<br/>/v1/embeddings"]
        Llm["OllamaCardAnswerService<br/>streaming chat"]
    end

    C --> CSvc --> Repo --> Ctx --> PG[("Postgres + pgvector")]
    R --> RSvc --> Repo
    RSvc --> Llm --> OL[Ollama]
    CSvc --> Emb --> OL
    Repo -->|query embedding| Emb
    CU -.->|UserId| Ctx
```

Layers: **Api** (controllers, DTO contracts, `CollectionMapper`), then **Application** (use cases), then **Persistence** (EF Core). The `Services/` layer wraps the AI calls.

## Data model

```mermaid
erDiagram
    collections ||--o{ cards : contains
    cards ||--o| card_embeddings : "has (cascade)"

    collections {
        string Id PK "client-generated GUID (36 chars)"
        string UserId "owner, indexed"
        string Title
        string Description
        string Emoji
        string Kind "NORMAL|INBOX, one INBOX per user (partial unique index)"
        long Ordinal "identity, insertion order"
    }
    cards {
        string Id PK "GUID"
        string CollectionId FK
        string UserId "shadow property, denormalized owner"
        string Key
        jsonb Value "any JSON shape"
        string CardType "SUBJECT|STORY|KEY_VALUE|CHECKBOX|LINK|IMAGE"
        bool IsFavorite
        bool IsArchived
        int Position "index with CollectionId"
    }
    card_embeddings {
        string CardId PK,FK
        vector Embedding "vector(768), HNSW index"
    }
```

- **Multi-tenancy.** Global query filters on all three tables restrict every query to `ICurrentUser.UserId`. `SaveChanges` stamps the owner on new rows. Repositories never filter by user.
- **Background work.** `CurrentUser` also implements `IUserContext`. Code without an HTTP request (future Kafka consumers) creates a DI scope and calls `Set(userId)`, so the same query filters apply.
- **Inbox.** Each user has one inbox (`Kind = INBOX`). Its ID is a deterministic UUIDv5 of the user ID (`Domain/Collections/InboxId.cs`). `EnsureInboxAsync` creates it on `GET /api/Collections` and `POST inbox`. The first time it runs, it adopts the cards of the old shared inbox `inbox000…` if this user owned it. The inbox is returned first and can't be deleted (DELETE is a no-op returning 204, so the client outbox doesn't get stuck). The `Kind` value sent by the client is ignored.
- **Embeddings** are kept in a separate table, so ordinary reads don't load the vectors. The embedded text is `"{Key}: {Value}"`. If embedding fails, the error is logged and the card is still saved without a vector.
- Migrations are in `Persistence/Migrations` and run automatically at startup.

## RAG flow

```mermaid
sequenceDiagram
    participant UI
    participant RAG as RAGController
    participant Repo
    participant Ollama
    UI->>RAG: POST /api/RAG/search  "query" (bare JSON string)
    RAG->>Ollama: embed "search_query: ..."
    RAG->>Repo: top 10 by cosine distance, keep <= 0.5, take 3
    RAG-->>UI: event: cards  [CardResponse...]
    RAG->>Ollama: stream answer (system prompt + numbered memories)
    loop each chunk
        RAG-->>UI: event: token
    end
    RAG-->>UI: event: done   (or event: error)
```

## API

| Method | Route | Notes |
|---|---|---|
| GET | `/api/Collections` | The current user's collections with their cards. The inbox comes first, and each collection has a `kind`. |
| GET / PUT / DELETE | `/api/Collections/{id}` | `id` must be 36 characters. PUT creates the collection if it is missing (upsert). |
| POST | `/api/Collections` | Create a collection. The client supplies the `id`. |
| POST / PUT / DELETE | `/api/Collections/{id}/Cards` | DELETE takes the body `{ cardId }`. PUT updates content only and keeps the card's `Position`. |
| PUT | `/api/Collections/{id}/Cards/order` | Reorders cards. Body `{ cardIds: [...] }` in the new order; each card's `Position` becomes its index. Unknown IDs are ignored, and cards left out keep their relative order after the listed ones. Idempotent. 204, or 404 if the collection doesn't exist. |
| POST | `/api/Collections/{targetId}/Cards/{cardId}/move` | Moves a card to the end of the target collection. The card keeps its ID and embedding. Idempotent. 404 if the card or the target isn't visible to the user. |
| POST | `/api/Collections/inbox` | Used by the Android share sheet. `{ text, type: "link"\|"any", key? }` goes into the user's inbox, which is created if missing. |
| GET | `/health` | Liveness check used by the AppHost. |
| POST | `/api/RAG/search` | Server-sent events (SSE) stream, see above. |

Calling the API directly needs an `X-Profile: {"id":"…","name":"…"}` header. Without it, DB access throws `Unauthorized`.

## Run

```bash
dotnet run                     # Swagger at /swagger (Development)
dotnet tool restore && dotnet ef migrations add <Name> -o Persistence/Migrations
```

Configuration: `CollectionsDB:ConnectionString`, `Embedding:Endpoint|Model`, `Llm:OllamaEndpoint|Model`. Aspire sets these as environment variables.
