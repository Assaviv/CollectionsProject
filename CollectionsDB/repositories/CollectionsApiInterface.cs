using CollectionsDB.Models;

namespace CollectionsDB.Repositories;

public interface CollectionsApiInterface
{
    public void CreateCollection(Collection newCollection);
    public void CreateCard(string collectionId, Card newCard);

    public List<Collection> GetCollections();
    public Collection? GetCollection(string id); 

    public void UpdateCollection(string id, Collection updatedCollection) ;
    public bool UpdateCard(string collectionId, Card card);

    public void RemoveCollection(string id);
    public void DeleteCard(string collectionId, string cardId);

    public List<Card> SearchCards(string query);
}
