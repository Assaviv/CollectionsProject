using System.Text.Json;
using System.Text.Json.Serialization;

namespace CollectionsDB.Api.Contracts.Search;

[JsonConverter(typeof(SearchCardsRequestConverter))]
public sealed record SearchCardsRequest(string? Query);

public sealed class SearchCardsRequestConverter : JsonConverter<SearchCardsRequest>
{
    public override SearchCardsRequest Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return new SearchCardsRequest(null);
        }

        if (reader.TokenType != JsonTokenType.String)
        {
            throw new JsonException("The search request must be a JSON string.");
        }

        return new SearchCardsRequest(reader.GetString());
    }

    public override void Write(Utf8JsonWriter writer, SearchCardsRequest value, JsonSerializerOptions options)
    {
        if (value.Query is null)
        {
            writer.WriteNullValue();
            return;
        }

        writer.WriteStringValue(value.Query);
    }
}
