namespace SaveApp.Contracts.Events;

/// <summary>Kafka topic names. The version suffix changes only on breaking payload changes.</summary>
public static class Topics
{
    /// <summary>Card lifecycle. Key = card id. Producer: CollectionsService.</summary>
    public const string Cards = "saveapp.cards.v1";

    /// <summary>Collection lifecycle. Key = collection id. Producer: CollectionsService.</summary>
    public const string Collections = "saveapp.collections.v1";

    /// <summary>Enrichment snapshots. Key = card id. Producer: EnrichmentService.</summary>
    public const string Enrichment = "saveapp.enrichment.v1";

    /// <summary>Every topic the system uses. The AppHost creates them (kafka-init) before services start.</summary>
    public static readonly IReadOnlyList<string> All = [Cards, Collections, Enrichment];
}

/// <summary>Values of <see cref="EventEnvelope{T}.Type"/>, also sent as the <c>type</c> message header.</summary>
public static class EventTypes
{
    public const string CardCreated = "CardCreated";
    public const string CardUpdated = "CardUpdated";
    public const string CardMoved = "CardMoved";
    public const string CardDeleted = "CardDeleted";
    public const string CollectionUpserted = "CollectionUpserted";
    public const string CollectionDeleted = "CollectionDeleted";
}

/// <summary>Kafka message header names.</summary>
public static class EventHeaders
{
    public const string Type = "type";
    public const string EventId = "eventId";
}
