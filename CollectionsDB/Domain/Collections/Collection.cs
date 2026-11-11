using CollectionsDB.Domain.Cards;

namespace CollectionsDB.Domain.Collections;

public class Collection
{
    public required string Id { get; set; }
    
    public string UserId { get; set; }

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    // TODO: work on depcrication of this field, support images instead?
    public string Emoji { get; set; } = "📚";

    public List<Card> Cards { get; set; } = new List<Card>()!; 
}
