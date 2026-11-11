using CollectionsDB.Models;
using static CollectionsDB.Controllers.CollectionsController;

namespace CollectionsDB.Repositories;

public interface CollectionsApiInterface
{
    public void CreateCollection(Collection newCollection);
    public void CreateCard(string collectionId, Card newCard);

    public List<Collection> GetCollections();
    public Collection? GetCollection(string collectionId); 

    public void UpdateCollection(string collectionId, Collection updatedCollection) ;
    public bool UpdateCard(string collectionId, Card card);

    public void RemoveCollection(string collectionId);
    public void DeleteCard(string collectionId, string cardId);

    public List<Card> SearchCards(string query);
}
