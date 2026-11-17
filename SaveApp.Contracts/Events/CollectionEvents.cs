namespace SaveApp.Contracts.Events;

/// <summary>Payload of <c>CollectionUpserted</c> (created or title/description/emoji changed).</summary>
public sealed record CollectionUpsertedPayload(
    string CollectionId,
    string Title,
    string Description,
    string Emoji,
    string Kind);

/// <summary>Payload of <c>CollectionDeleted</c>. A <c>CardDeleted</c> is also emitted for each of its cards.</summary>
public sealed record CollectionDeletedPayload(string CollectionId);
