using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CollectionsService.Models;

public class Card
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("key")]
    public string Key { get; set; } = null!;

    [BsonElement("value")]
    public object? Value { get; set; } = null!;

    [BsonElement("cardType")]    
    public CardType CardType { get; set; }

    [BsonElement("isFavorite")]
    public bool IsFavorite { get; set; } = false;

    [BsonElement("isArchived")]
    public bool IsArchived { get; set; } = false;

    [BsonElement("order")]
    public int Order { get; set; } = -1;

    [BsonElement("embedding")]
    public double[]? Embedding { get; set; } = null;

    override public string ToString()
    {
        return $"Card(Id={Id}, Key={Key}, Value={Value})";
    }
}

public enum CardType
{
    SUBJECT,
    STORY,
    KEY_VALUE,
    CHECKBOX,
    LINK,
    IMAGE
}