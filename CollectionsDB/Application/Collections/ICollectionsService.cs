using CollectionsDB.Domain.Cards;
using CollectionsDB.Domain.Collections;

namespace CollectionsDB.Application.Collections;

public interface ICollectionsService
{
    Task<List<Collection>> GetCollectionsAsync();
    Task<Collection?> GetCollectionAsync(string id);
    Task CreateCollectionAsync(Collection collection);
    Task<Collection> EnsureInboxAsync();
    Task<bool> MoveCardAsync(string cardId, string targetCollectionId, string rank);
    Task UpdateCollectionAsync(string id, Collection collection);
    /// <summary>Returns false when the collection is the user's inbox, which cannot be deleted.</summary>
    Task<bool> RemoveCollectionAsync(string id);
    Task CreateCardAsync(string collectionId, Card card);
    Task DeleteCardAsync(string collectionId, string cardId);
    Task<bool> UpdateCardAsync(string collectionId, Card card);
}
