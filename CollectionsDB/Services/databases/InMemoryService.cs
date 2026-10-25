using CollectionsService.Models;
using Microsoft.Extensions.Options;

namespace CollectionsService.Services;

public class InMemoryService : CollectionsApiInterface
{
    private List<Collection> collections = new List<Collection>();

    public InMemoryService(IOptions<CollectionsDBSettings> collectionsDatabaseSettings){}

    // public async Task<List<Collection>> GetAsync() =>
    //     await _collection.Find(_ => true).ToListAsync();

    public List<Collection> GetAsync() => collections;

    // public async Task<Collection?> GetAsync(string id) =>
    //     await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();

    public Collection? GetAsync(string id) =>
        collections.Find(collection => collection.Id == id);

    // public async Task CreateAsync(Collection newCollection) =>
    //     await _collection.InsertOneAsync(newCollection);

    public void CreateAsync(Collection newCollection) =>
        collections.Add(newCollection);    

    // public async Task UpdateAsync(string id, Collection updatedCollection) =>
    //     await _collection.ReplaceOneAsync(x => x.Id == id, updatedCollection);

    public void UpdateAsync(string id, Collection updatedCollection) 
    {
        _ = collections.Remove(collections.Find(collection => collection.Id == id)!);
        collections.Add(updatedCollection);
    }

    // public async Task RemoveAsync(string id) =>
    //     await _collection.DeleteOneAsync(x => x.Id == id);

    public void RemoveAsync(string id)
    {
        collections.Remove(collections.Find(collection => collection.Id == id)!);
    }

    public void CreateCard(string id, Card newCard)
    {
        collections.Find(collection => collection.Id == id)?.Cards.Add(newCard);
    }

    public void DeleteCard(string collectionId, string cardId)
    {
        Card? card = collections.Find(Collection => Collection.Id == collectionId)?
                        .Cards.Find(card => card.Id == cardId);

        if (card is not null)
        {
            collections.Find(collection => collection.Id == collectionId)?.Cards.Remove(card);
        }
    }

    public List<Card> SearchCards(string query)
    {
        throw new NotImplementedException();
    }

    // public void UpdateCard(string collectionId, string cardId, Card updatedCard)
    // { }
}
