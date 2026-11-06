var builder = DistributedApplication.CreateBuilder(args);

// DATABSASES: postgres
var postgres = builder.AddPostgres("postgres")
    .WithImageRegistry(null)
    .WithImage("postgres-vector")
    .WithImageTag("latest")
    // .WithVolume("collections-pgdata", "/var/lib/postgresql")
    .WithPgAdmin();

var collectionsDb = postgres.AddDatabase("collections");

// MODELS: nomic-embed-text
var ollama = builder.AddOllama("ollama")
    .WithDataVolume()
    .WithLifetime(ContainerLifetime.Persistent);

var embeddingModel = ollama.AddModel("nomic-embed-text");

// BACKEND: collections-service
var server = builder.AddProject<Projects.CollectionsService>("collections-service")
    .WithReference(collectionsDb)
    .WithEnvironment("CollectionsDB__ConnectionString", collectionsDb.Resource.ConnectionStringExpression)
    .WithEnvironment("Embedding__Endpoint",
        ReferenceExpression.Create($"{ollama.GetEndpoint("http")}/v1/embeddings"))
    .WithEnvironment("Embedding__Model", "nomic-embed-text")
    .WaitFor(collectionsDb)
    .WithHttpHealthCheck("/health")
    .WithExternalHttpEndpoints(); 
    // TODO: order is borken now
    // TODO collection-service health

// SECURITY: Keycloak
var keycloak = builder.AddKeycloak("keycloak", 8080)
    // .WithDataVolume()
    .WithRealmImport("./Realms");

var issuer = builder.Configuration["Keycloak:IssuerUri"]
    ?? "https://keycloak-collections.dev.localhost:8080/realms/save-app";

var gateway = builder.AddExecutable("gateway", "./gradlew", "../SaveAppGateway", "bootRun")
    .WithHttpEndpoint(port: 8000, env: "SERVER_PORT", name: "http")
    .WithEnvironment("COLLECTIONS_URL", server.GetEndpoint("http"))
    .WithEnvironment("KEYCLOAK_ISSUER_URI", issuer)
    .WithEnvironment("SPRING_PROFILES_ACTIVE", "dev")
    .WaitFor(keycloak);

// FRONTEND: SaveApp Mobile, SaveApp Desktop
builder.AddNxApp("CollectionsUI", "../Collections-UI")
    .WithNpm(install: false)
    .WithPackageManagerLaunch()
    .AddApp("collections-ui")
    .WithHttpsEndpoint(port: 4200, env: "PORT", isProxied: false)
    .WithExternalHttpEndpoints();


builder.Build().Run();
