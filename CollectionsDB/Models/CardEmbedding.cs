using Pgvector;

namespace CollectionsDB.Models;

/// <summary>
/// One embedding per card, stored in its own table so that normal reads of a
/// collection never load the 768-float vector.
/// </summary>
public class CardEmbedding
{
    public string CardId { get; set; } = "";
    public Vector Embedding { get; set; } = null!;

    public Card Card { get; set; } = null!;
}
