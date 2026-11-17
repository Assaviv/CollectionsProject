# Welcome to SAVE App!

## Collections UI - main screen
This is the final product the customer will see containing `Collection`s which are list of `Card`s to index all of your memories
<img width="1364" height="725" alt="image" src="https://github.com/user-attachments/assets/a37648fb-0496-4376-866a-b56ea7c01656" />

## Collections UI - chat bot
This is the chat bot meant for retrieving and querying your memories!
<img width="1369" height="727" alt="image" src="https://github.com/user-attachments/assets/71c88284-8cb0-4945-81ca-c0da64db50da" />

## PROJECTS

```mermaid
flowchart LR
    UI["SaveApp-UI<br/>Angular web + Android"] -->|JWT| GW["SaveAppGateway<br/>Spring Cloud Gateway"]
    UI -.->|login| KC[Keycloak]
    GW -.->|JWKS| KC
    GW -->|X-Profile| CS["CollectionsDB<br/>ASP.NET Core API + RAG"]
    CS --> PG[("Postgres + pgvector")]
    CS --> OL["Ollama<br/>embeddings + LLM"]
    CS -->|"outbox → card/collection events"| KF{{Kafka}}
    AH["SaveApp.AppHost<br/>.NET Aspire"] -. orchestrates .-> UI & GW & CS & KC & PG & OL & KF
```

| Project | Description |
|---|---|
| [SaveApp-UI](SaveApp-UI/README.md) | Nx/Angular monorepo containing the web and Capacitor Android apps, the local-first sync, and the card-type registries |
| [SaveAppGateway](SaveAppGateway/README.md) | JWT validation, `X-Profile` identity forwarding, and routing `/api/**` |
| [CollectionsDB](CollectionsDB/README.md) | REST API, per-user data model, pgvector embeddings, and the RAG chat stream |
| [SaveApp.Contracts](SaveApp.Contracts/README.md) | Shared Kafka event contracts: envelope, topics, payloads |
| [SaveApp.AppHost](SaveApp.AppHost/README.md) | Aspire orchestration for local development and its configuration |

## DEVELOPMENT
This is the environment which we run the local development using Aspire .NET
<img width="1364" height="725" alt="image" src="https://github.com/user-attachments/assets/c590150c-134c-4507-83e9-dc24ba6a3b34" />

## ARCHITECTURE
This is the architecture auto built using Aspire .NET
<img width="1367" height="730" alt="image" src="https://github.com/user-attachments/assets/21827dfb-5f65-4da9-a3f0-b7c6fef3d3af" />
