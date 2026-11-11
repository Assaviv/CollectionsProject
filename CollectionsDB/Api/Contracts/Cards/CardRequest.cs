using System.Text.Json;

namespace CollectionsDB.Api.Contracts.Cards;

public sealed class CardRequest
{
    private string _id = Guid.NewGuid().ToString();

    public string Id
    {
        get => _id;
        set => _id = string.IsNullOrWhiteSpace(value) ? Guid.NewGuid().ToString() : value;
    }

    public string CollectionId { get; set; } = "";
    public string Key { get; set; } = null!;
    public JsonElement? Value { get; set; }
    public CardTypeContract CardType { get; set; }
    public bool IsFavorite { get; set; }
    public bool IsArchived { get; set; }
    public int Position { get; set; } = -1;
}
