using System.Text.Json;

namespace CollectionsDB.Api.Contracts.Collections;

public record InboxRequest(JsonElement text, string type, string? key);
