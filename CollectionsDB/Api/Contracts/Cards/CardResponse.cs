using System.Text.Json;

namespace CollectionsDB.Api.Contracts.Cards;

public sealed record CardResponse(
    string Id,
    string CollectionId,
    string Key,
    JsonElement? Value,
    CardTypeContract CardType,
    bool IsFavorite,
    bool IsArchived,
    int Position);
