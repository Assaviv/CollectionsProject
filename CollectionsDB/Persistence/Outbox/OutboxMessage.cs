namespace CollectionsDB.Persistence.Outbox;

/// <summary>
/// An event waiting to be published to Kafka. Written in the same transaction as the
/// change it describes (transactional outbox), so a change and its event are never
/// saved without each other. Not tenant-filtered: the publisher reads every user's rows.
/// </summary>
public sealed class OutboxMessage
{
    /// <summary>Publish order. Identity column.</summary>
    public long Sequence { get; set; }

    public Guid EventId { get; set; }

    public string Topic { get; set; } = null!;

    /// <summary>Kafka message key (card or collection id), so one entity's events stay ordered.</summary>
    public string Key { get; set; } = null!;

    public string Type { get; set; } = null!;

    /// <summary>The serialized <c>EventEnvelope</c> (jsonb).</summary>
    public string Payload { get; set; } = null!;

    public DateTimeOffset OccurredAt { get; set; }

    public DateTimeOffset? PublishedAt { get; set; }

    public int Attempts { get; set; }

    public string? LastError { get; set; }
}
