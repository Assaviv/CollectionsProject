using CollectionsDB.Domain.Cards;

namespace CollectionsDB.Domain.Collections;

public enum CollectionKind
{
    NORMAL,
    // Exactly one per user. Holds "orphan" cards until they are moved somewhere.
    INBOX
}

public class Collection
{
    public required string Id { get; set; }
    
    public string UserId { get; set; }

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    // TODO: work on depcrication of this field, support images instead?
    public string Emoji { get; set; } = "📚";

    // Set by the server only (EnsureInbox). Never taken from a client request.
    public CollectionKind Kind { get; set; } = CollectionKind.NORMAL;

    public List<Card> Cards { get; set; } = new List<Card>()!; 
}
