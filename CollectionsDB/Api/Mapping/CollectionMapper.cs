using CollectionsDB.Api.Contracts.Collections;
using CollectionsDB.Api.Contracts.Cards;
using CollectionsDB.Domain.Cards;
using CollectionsDB.Domain.Collections;

namespace CollectionsDB.Api.Mapping;

public static class CollectionMapper
{
    public static Collection ToDomain(this CreateCollectionRequest request) => new()
    {
        Id = request.Id,
        Title = request.Title,
        Description = request.Description,
        Emoji = request.Emoji,
        Cards = request.Cards.Select(ToDomain).ToList()
    };

    public static Collection ToDomain(this UpdateCollectionRequest request) => new()
    {
        Id = request.Id,
        UserId = request.UserId,
        Title = request.Title,
        Description = request.Description,
        Emoji = request.Emoji,
        Cards = request.Cards.Select(ToDomain).ToList()
    };

    public static Card ToDomain(this CardRequest request) => new()
    {
        Id = request.Id,
        CollectionId = request.CollectionId,
        Key = request.Key,
        Value = request.Value,
        CardType = (CardType)request.CardType,
        IsFavorite = request.IsFavorite,
        IsArchived = request.IsArchived,
        Position = request.Position
    };

    public static CollectionResponse ToResponse(this Collection collection) => new(
        collection.Id,
        collection.UserId,
        collection.Title,
        collection.Description,
        collection.Emoji,
        collection.Cards.Select(ToResponse).ToList());

    public static CardResponse ToResponse(this Card card) => new(
        card.Id,
        card.CollectionId,
        card.Key,
        card.Value,
        (CardTypeContract)card.CardType,
        card.IsFavorite,
        card.IsArchived,
        card.Position);
}
