using CollectionsDB.Domain.Cards;
using CollectionsDB.Domain.Collections;

namespace CollectionsDB.Application.Collections;

public interface ICollectionsService
{
    Task<List<Collection>> GetCollectionsAsync();
    Task<Collection?> GetCollectionAsync(string id);
    Task CreateCollectionAsync(Collection collection);
    Task CreateInboxCardAsync(string collectionId, Card card);
    Task UpdateCollectionAsync(string id, Collection collection);
    Task RemoveCollectionAsync(string id);
    Task CreateCardAsync(string collectionId, Card card);
    Task DeleteCardAsync(string collectionId, string cardId);
    Task<bool> UpdateCardAsync(string collectionId, Card card);
}
