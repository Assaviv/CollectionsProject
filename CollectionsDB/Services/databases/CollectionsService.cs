using CollectionsService.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace CollectionsService.Services;

public interface CollectionsApiInterface
{
    // public async Task<List<Collection>> GetAsync()
    public List<Collection> GetAsync();
    // public async Task<Collection?> GetAsync(string id)
    public Collection? GetAsync(string id); // =>
    // public async Task CreateAsync(Collection newCollection)
    public void CreateAsync(Collection newCollection);// =>
    // public async Task UpdateAsync(string id, Collection updatedCollection)
    public void UpdateAsync(string id, Collection updatedCollection) ;
    // public async Task RemoveAsync(string id);
    public void RemoveAsync(string id);
    public void CreateCard(string id, Card newCard);
    public void DeleteCard(string collectionId, string cardId);
    // public void UpdateCard(string collectionId, string cardId, Card updatedCard)
    // { }
    public List<Card> SearchCards(string query);
}
