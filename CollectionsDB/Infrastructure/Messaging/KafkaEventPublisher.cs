using System.Text;
using CollectionsDB.Application.Events;
using Confluent.Kafka;
using SaveApp.Contracts.Events;

namespace CollectionsDB.Infrastructure.Messaging;

/// <summary>
/// The only class in this service that talks to Kafka, and it only produces messages.
/// Topics are created by the AppHost (kafka-init), never by the service.
/// </summary>
public sealed class KafkaEventPublisher(IProducer<string, string> producer) : IEventPublisher
{
    public async Task PublishAsync(OutgoingEvent outgoing, CancellationToken cancellationToken)
    {
        var message = new Message<string, string>
        {
            Key = outgoing.Key,
            Value = outgoing.Payload,
            Timestamp = new Timestamp(outgoing.OccurredAt.UtcDateTime),
            Headers = new Headers
            {
                { EventHeaders.Type, Encoding.UTF8.GetBytes(outgoing.Type) },
                { EventHeaders.EventId, Encoding.UTF8.GetBytes(outgoing.EventId.ToString()) },
            },
        };

        // Throws ProduceException if the broker rejects it (e.g. unknown topic) or times out.
        await producer.ProduceAsync(outgoing.Topic, message, cancellationToken);
    }
}
