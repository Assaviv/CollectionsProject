namespace CollectionsDB.Application.Events;

/// <summary>An event ready to leave the service. The payload is the serialized envelope.</summary>
public sealed record OutgoingEvent(
    Guid EventId,
    string Topic,
    string Key,
    string Type,
    string Payload,
    DateTimeOffset OccurredAt);

/// <summary>
/// Sends one event to the message broker. Throws if the broker didn't accept it.
/// The only implementation that knows about Kafka is KafkaEventPublisher.
/// </summary>
public interface IEventPublisher
{
    Task PublishAsync(OutgoingEvent outgoing, CancellationToken cancellationToken);
}
