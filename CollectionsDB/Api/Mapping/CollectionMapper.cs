using CollectionsDB.Api.Contracts.Collections;
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
        Cards = request.Cards
    };
}
