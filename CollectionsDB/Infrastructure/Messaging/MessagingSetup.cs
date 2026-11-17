using CollectionsDB.Application.Events;
using CollectionsDB.Infrastructure.Outbox;
using CollectionsDB.Persistence.Outbox;
using Confluent.Kafka;

namespace CollectionsDB.Infrastructure.Messaging;

public static class MessagingSetup
{
    /// <summary>Aspire resource / connection string name (ConnectionStrings:kafka).</summary>
    public const string KafkaConnectionName = "kafka";

    public static bool IsKafkaConfigured(this IConfiguration configuration) =>
        !string.IsNullOrWhiteSpace(configuration.GetConnectionString(KafkaConnectionName));

    /// <summary>
    /// The outbox is always on: saves always write event rows. The relay that sends them
    /// (and the Kafka producer) are only registered when Kafka is configured. Without it
    /// (plain <c>dotnet run</c>) rows wait and are sent the next time Kafka is there.
    /// </summary>
    public static void AddMessaging(this WebApplicationBuilder builder)
    {
        builder.Services.AddSingleton<OutboxSignal>();
        builder.Services.AddScoped<OutboxStore>();
        builder.Services.Configure<OutboxOptions>(builder.Configuration.GetSection(OutboxOptions.Section));
        builder.Services.AddHostedService<OutboxCleanup>();

        if (!builder.Configuration.IsKafkaConfigured())
        {
            return;
        }

        builder.AddKafkaProducer<string, string>(KafkaConnectionName, settings =>
        {
            // /health stays about the API. The outbox buffers events while Kafka is down.
            settings.DisableHealthChecks = true;
            settings.Config.EnableIdempotence = true;
            settings.Config.Acks = Acks.All;
            // Fail a send after 30 s instead of the 5 min default, so a problem (e.g. a
            // missing topic) shows up in outbox_messages.LastError and gets retried.
            settings.Config.MessageTimeoutMs = 30_000;
        });
        builder.Services.AddSingleton<IEventPublisher, KafkaEventPublisher>();
        builder.Services.AddHostedService<OutboxRelay>();
    }
}
