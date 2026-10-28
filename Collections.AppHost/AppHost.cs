var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
    .WithImageRegistry(null)
    .WithImage("postgres-vector")
    .WithImageTag("latest")
    // .WithVolume("collections-pgdata", "/var/lib/postgresql")
    .WithPgAdmin();

var collectionsDb = postgres.AddDatabase("collections");

var ollama = builder.AddOllama("ollama")
    .WithDataVolume()
    .WithLifetime(ContainerLifetime.Persistent);

var embeddingModel = ollama.AddModel("nomic-embed-text");

var server = builder.AddProject<Projects.CollectionsService>("collections-service")
    .WithReference(collectionsDb)
    .WithEnvironment("CollectionsDB__ConnectionString", collectionsDb.Resource.ConnectionStringExpression)
    .WithEnvironment("Embedding__Endpoint",
        ReferenceExpression.Create($"{ollama.GetEndpoint("http")}/v1/embeddings"))
    .WithEnvironment("Embedding__Model", "nomic-embed-text")
    .WaitFor(collectionsDb)
    .WithHttpHealthCheck("/health")
    .WithExternalHttpEndpoints(); // TODO: order is borken now
    // TODO collection-service health

builder.AddNxApp("CollectionsUI", "../CollectionsUI")
    .WithNpm(install: false)
    .WithPackageManagerLaunch()
    .AddApp("collections-ui")
    .WithHttpEndpoint(port: 4200, env: "PORT", isProxied: false)
    .WithExternalHttpEndpoints();
    // TODO: fix redundent loading of collections

builder.Build().Run();
