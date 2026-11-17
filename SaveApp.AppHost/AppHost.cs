using Microsoft.Extensions.Configuration;
using SaveApp.Contracts.Events;

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


// MESSAGING: Kafka (KRaft, single broker) + Kafka UI
// CollectionsService publishes card/collection events through its outbox.
// Topics are infrastructure: kafka-init creates them (with the right partition count),
// services never do. Broker auto-create must stay ON: Aspire's Kafka health check
// produces to "healthchecks-topic", and with auto-create off Kafka never turns healthy,
// which blocks kafka-init and every service waiting on it.
var kafka = builder.AddKafka("kafka")
    .WithKafkaUI();

var topicPartitions = configMap.GetValue("KafkaTopicPartitions", 3);
var createTopics = string.Join(" && ", Topics.All.Select(topic =>
    $"kafka-topics --bootstrap-server \"$BOOTSTRAP\" --create --if-not-exists " +
    $"--topic {topic} --partitions {topicPartitions} --replication-factor 1"));

// One-shot container using the broker's own image (it ships the kafka-topics CLI).
// Services wait for it to finish before they start.
var kafkaImage = kafka.Resource.Annotations.OfType<ContainerImageAnnotation>().Single();
var kafkaInit = builder.AddContainer("kafka-init", kafkaImage.Image, kafkaImage.Tag!)
    .WithImageRegistry(kafkaImage.Registry)
    .WithEnvironment("BOOTSTRAP", ReferenceExpression.Create(
        $"{kafka.Resource.Name}:{kafka.Resource.InternalEndpoint.Property(EndpointProperty.TargetPort)}"))
    .WithEntrypoint("/bin/sh")
    .WithArgs("-c", createTopics)
    .WaitFor(kafka);


// MODELS: nomic-embed-text
var ollama = builder.AddOllama("ollama")
    .WithDataVolume()
    .WithLifetime(ContainerLifetime.Persistent);

var embeddingModel = ollama.AddModel("nomic-embed-text");
var answerModel = ollama.AddModel("qwen3:8b");


// BACKEND: collections-service
var server = builder.AddProject<Projects.CollectionsService>("collections-service")
    .WithReference(collectionsDb)
    .WithEnvironment("CollectionsDB__ConnectionString", collectionsDb.Resource.ConnectionStringExpression)
    .WithEnvironment("Embedding__Endpoint",
        ReferenceExpression.Create($"{ollama.GetEndpoint("http")}/v1/embeddings"))
    .WithEnvironment("Embedding__Model", "nomic-embed-text")
    .WithEnvironment("Llm__Endpoint",
        ReferenceExpression.Create($"{ollama.GetEndpoint("http")}/v1/chat/completions"))
    .WithEnvironment("Llm__Model", "qwen3:8b")
    .WithEnvironment("Llm__OllamaEndpoint",
        ReferenceExpression.Create($"{ollama.GetEndpoint("http")}"))
    .WithReference(kafka)
    .WaitFor(collectionsDb)
    .WaitForCompletion(kafkaInit)
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
    kafka.WithDataVolume();
}

builder.Build().Run();
