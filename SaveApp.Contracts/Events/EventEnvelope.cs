using System.Text.Json;
using System.Text.Json.Serialization;

namespace SaveApp.Contracts.Events;

/// <summary>
/// Wrapper for every event on every topic. <see cref="EventId"/> is unique and lets
/// consumers drop redeliveries. <see cref="UserId"/> is the owner; consumers act as
/// that user (IUserContext.Set) so tenant filters keep working.
/// </summary>
public sealed record EventEnvelope<T>(
    Guid EventId,
    string Type,
    int Version,
    DateTimeOffset OccurredAt,
    string UserId,
    T Payload);

public static class EventEnvelope
{
    public const int CurrentVersion = 1;

    public static EventEnvelope<T> Create<T>(string type, string userId, T payload) =>
        new(Guid.CreateVersion7(), type, CurrentVersion, DateTimeOffset.UtcNow, userId, payload);
}

/// <summary>The one JSON shape all producers and consumers use: camelCase, enums as strings.</summary>
public static class EventJson
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public static string Serialize<T>(EventEnvelope<T> envelope) => JsonSerializer.Serialize(envelope, Options);

    public static EventEnvelope<T>? Deserialize<T>(string json) =>
        JsonSerializer.Deserialize<EventEnvelope<T>>(json, Options);
}
