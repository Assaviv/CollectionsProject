# SaveApp.AppHost

The .NET Aspire orchestrator for local development. One command starts the whole system and wires the services together with connection strings and environment variables.

```bash
aspire run        # from the repo root (aspire.config.json points here)
```

## Architecture

```mermaid
flowchart LR
    subgraph Containers
        PG[("postgres<br/>image: postgres-vector")]
        PGA[pgAdmin]
        OL["ollama<br/>nomic-embed-text, qwen3:8b"]
        KC["keycloak :8443<br/>realm import ./Realms"]
    end

    subgraph Processes
        CS["collections-service<br/>(CollectionsDB project)"]
        GW["gateway :8000<br/>./gradlew bootRun"]
        UI["SaveAppUI / save-app-web :4200<br/>nx serve -c aspire"]
    end

    PGA --- PG
    CS -->|"CollectionsDB__ConnectionString"| PG
    CS -->|"Embedding__* / Llm__*"| OL
    GW -->|"COLLECTIONS_DB_URL"| CS
    GW -->|"KEYCLOAK_ISSUER_URI / JWK_SET_URI"| KC
    UI -->|"/api proxy"| GW
    UI -.->|login| KC
```

Startup order: `collections-service` waits for the database, and `gateway` waits for Keycloak.

## Configuration

`appsettings.json` → `App` section:

| Key | Effect |
|---|---|
| `AuthenticationEnabled` | Passed to the gateway as `APP_SECURITY_ENABLED`. |
| `Realm`, `ClientId` | Keycloak realm (`save-app`) and the web client. |
| `KeycloakUrl` / `KeycloakPublicUrl` | Both are accepted token issuers. The public URL is the Tailscale host, which the mobile app uses. |
| `IsPersistent` | When `true`, Postgres and Keycloak get data volumes. When `false`, all data is lost on restart. |

`Realms/save-app-realm.json` is imported into Keycloak at startup. It defines the `save-app` realm, the public PKCE clients `save-app-ui` and `save-app-mobile`, and their redirect URIs (web origins, `capacitor://localhost`, `com.aviv.saveapp:/…`).

## Prerequisites

- Build the Postgres image: `docker build -f CollectionsDB/Dockerfile.postgres -t postgres-vector CollectionsDB`
- `npm install` in `SaveApp-UI/`. The AppHost runs it with `install: false`, so it won't install for you.
- JDK 25 for the gateway.
