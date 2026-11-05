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

// SECURITY: Keycloack
var keycloack = builder.AddKeycloak("keycloak", 8080)
    .WithDataVolume()
    .WithRealmImport("./Realms");

// FRONTEND: SaveApp Mobile, SaveApp Desktop
builder.AddNxApp("CollectionsUI", "../Collections-UI")
    .WithNpm(install: false)
    .WithPackageManagerLaunch()
    .AddApp("collections-ui")
    .WithHttpEndpoint(port: 4200, env: "PORT", isProxied: false)
    .WithExternalHttpEndpoints();


builder.Build().Run();
