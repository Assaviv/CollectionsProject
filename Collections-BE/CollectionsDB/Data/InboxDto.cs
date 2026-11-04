using System.Text.Json;

namespace CollectionsDB.Data;

public record InboxDto(JsonElement text, string type, string? key);
