using CollectionsDB.Domain.Cards;
using CollectionsDB.Domain.Collections;

namespace CollectionsDB.Persistence.Repositories;

public interface ICollectionsRepository
{
    public Task CreateCollectionAsync(Collection newCollection);
    public Task CreateCardAsync(string collectionId, Card newCard);

    public Task<List<Collection>> GetCollectionsAsync();
    public Task<Collection?> GetCollectionAsync(string collectionId);

    public Task UpdateCollectionAsync(string collectionId, Collection updatedCollection);
    public Task<bool> UpdateCardAsync(string collectionId, Card card);

    public Task RemoveCollectionAsync(string collectionId);
    public Task DeleteCardAsync(string collectionId, string cardId);

    public Task<List<Card>> SearchCardsAsync(string query, double maxDistance = 0.5, int take = 3);
}
