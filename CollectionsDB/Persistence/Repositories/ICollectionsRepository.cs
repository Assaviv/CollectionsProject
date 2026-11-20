using CollectionsDB.Domain.Cards;
using CollectionsDB.Domain.Collections;

namespace CollectionsDB.Persistence.Repositories;

public interface ICollectionsRepository
{
    public Task CreateCollectionAsync(Collection newCollection);
    public Task CreateCardAsync(string collectionId, Card newCard);

    public Task<List<Collection>> GetCollectionsAsync();
    public Task<bool> CollectionExistsAsync(string collectionId);

    /// <summary>Creates the inbox; returns false if it already existed (e.g. a concurrent request won).</summary>
    public Task<bool> TryCreateInboxAsync(Collection inbox);

    /// <summary>Moves every card of <paramref name="fromId"/> to the end of <paramref name="toId"/> and deletes the source.</summary>
    public Task AdoptCardsAndDeleteAsync(string fromId, string toId);
    public Task<Collection?> GetCollectionAsync(string collectionId);

    public Task UpdateCollectionAsync(string collectionId, Collection updatedCollection);
    public Task<bool> UpdateCardAsync(string collectionId, Card card);

    public Task RemoveCollectionAsync(string collectionId);
    public Task DeleteCardAsync(string collectionId, string cardId);

    /// <summary>Moves a card (same id, so its embedding follows) to the end of the target collection.</summary>
    public Task<bool> MoveCardAsync(string cardId, string targetCollectionId);

    /// <summary>
    /// Sets each card's position to its index in <paramref name="orderedCardIds"/>. Unknown ids are ignored;
    /// cards missing from the list keep their relative order after the listed ones. False if the collection doesn't exist.
    /// </summary>
    public Task<bool> ReorderCardsAsync(string collectionId, IReadOnlyList<string> orderedCardIds);

    public Task<List<Card>> SearchCardsAsync(string query, double maxDistance = 0.5, int take = 3);
}
