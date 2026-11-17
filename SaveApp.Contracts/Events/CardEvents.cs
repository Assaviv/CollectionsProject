using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace SaveApp.Contracts.Events;

/// <summary>
/// Payload of <c>CardCreated</c> and <c>CardUpdated</c>: the full card content, so a
/// consumer never needs to call back into CollectionsService.
/// </summary>
public sealed record CardUpsertedPayload(
    string CardId,
    string CollectionId,
    bool CollectionIsInbox,
    string CardType,
    string Key,
    JsonElement? Value,
    bool IsFavorite,
    bool IsArchived,
    string ContentHash);

/// <summary>Payload of <c>CardMoved</c>. The card id (and its content) is unchanged.</summary>
public sealed record CardMovedPayload(
    string CardId,
    string FromCollectionId,
    string ToCollectionId,
    bool ToIsInbox);

/// <summary>Payload of <c>CardDeleted</c>.</summary>
public sealed record CardDeletedPayload(string CardId, string CollectionId);

public static class CardContent
{
    /// <summary>
    /// Hash of what enrichment reads (type, key, value). Consumers skip expensive work
    /// (the LLM stage) when it hasn't changed. Favorite/archived flags are excluded on purpose.
    /// </summary>
    public static string Hash(string cardType, string key, JsonElement? value)
    {
        var text = $"{cardType}\n{key}\n{(value is { } v ? v.GetRawText() : "")}";
        return Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(text)))[..32];
    }
}
