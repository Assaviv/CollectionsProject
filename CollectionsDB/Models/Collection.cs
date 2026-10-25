using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CollectionsService.Models;

public class Collection
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public required string Id { get; set; }

    [BsonElement("name")]
    public string Title { get; set; } = null!;

    [BsonElement("description")]
    public string Description { get; set; } = null!;

    [BsonElement("icon")]
    public string Emoji { get; set; } = "📚";

    [BsonElement("cards")]
    public List<Card> Cards { get; set; } = new List<Card>()!; 
}