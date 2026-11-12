using Microsoft.Extensions.Configuration;

var builder = DistributedApplication.CreateBuilder(args);

var configMap = builder.Configuration.GetSection("App");
var isSecure = configMap.GetValue<bool>("AuthenticationEnabled").ToString().ToLower();
var isPersistent = configMap.GetValue<bool>("IsPersistent");


// DATABSASES: postgres
var postgres = builder.AddPostgres("postgres")
    .WithImageRegistry(null)
    .WithImage("postgres-vector")
    .WithImageTag("latest")
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


// SECURITY: Keycloak
var keycloakLocal = configMap["KeycloakUrl"];
var keycloakPublic = configMap["KeycloakPublicUrl"];
var realm = configMap["Realm"];

var allowedIssuers = string.Join(",",
    $"{keycloakLocal}/realms/{realm}",
    $"{keycloakPublic}/realms/{realm}");
// var issuer = $"{keycloakUrl}/realms/{configMap["Realm"]}"; 

var keycloak = builder.AddKeycloak("keycloak", 8443)
    // .WithEnvironment("KC_HOSTNAME", keycloakUrl)
    .WithEnvironment("KC_HOSTNAME_STRICT", "false")
    .WithEnvironment("KC_PROXY_HEADERS", "xforwarded")
    .WithRealmImport("./Realms");

var gateway = builder.AddExecutable("gateway", "./gradlew", "../SaveAppGateway", "bootRun")
    .WithHttpEndpoint(port: 8000, env: "SERVER_PORT", name: "http")
    .WithEnvironment("COLLECTIONS_DB_URL", server.GetEndpoint("http"))
    .WithEnvironment("APP_SECURITY_ENABLED", isSecure)
    // .WithEnvironment("KEYCLOAK_ISSUER_URI", issuer)
    .WithEnvironment("KEYCLOAK_ISSUER_URI", $"{keycloakLocal}/realms/{realm}")
    .WithEnvironment("KEYCLOAK_JWK_SET_URI", $"https://localhost:8443/realms/{realm}/protocol/openid-connect/certs")
    .WithEnvironment("APP_SECURITY_ALLOWED_ISSUERS", allowedIssuers)
    .WithEnvironment("SPRING_PROFILES_ACTIVE", "dev")
    .WaitFor(keycloak);


// FRONTEND: SaveApp Mobile, SaveApp Desktop
builder.AddNxApp("SaveAppUI", "../SaveApp-UI")
    .WithNpm(install: false)
    .WithPackageManagerLaunch()
    .AddApp("save-app-web")
    .WithHttpsEndpoint(port: 4200, env: "PORT", isProxied: false)
    .WithExternalHttpEndpoints()
    .WithArgs("-c", "aspire");


// CONDITIONAL BUILD
if (isPersistent)
{
    postgres.WithVolume("collections-pgdata", "/var/lib/postgresql");
    keycloak.WithDataVolume();
}

builder.Build().Run();
