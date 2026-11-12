using CollectionsDB.Domain.Cards;
using CollectionsDB.Domain.Collections;
using CollectionsDB.Persistence.Repositories;
using CollectionsDB.Services.Embeddings;

namespace CollectionsDB.Application.Collections;

public sealed class CollectionsService(
    ICollectionsRepository repository,
    EmbeddingService embeddingService,
    ILogger<CollectionsService> logger) : ICollectionsService
{
    public Task<List<Collection>> GetCollectionsAsync() => repository.GetCollectionsAsync();

    public Task<Collection?> GetCollectionAsync(string id) => repository.GetCollectionAsync(id);

    public Task CreateCollectionAsync(Collection collection) => repository.CreateCollectionAsync(collection);

    public async Task CreateInboxCardAsync(string collectionId, Card card)
    {
        card.Embedding = await TryGetEmbeddingAsync(card);
        await repository.CreateCardAsync(collectionId, card);
    }

    public Task UpdateCollectionAsync(string id, Collection collection) => repository.UpdateCollectionAsync(id, collection);

    public Task RemoveCollectionAsync(string id) => repository.RemoveCollectionAsync(id);

    public async Task CreateCardAsync(string collectionId, Card card)
    {
        card.Embedding = await TryGetEmbeddingAsync(card);
        await repository.CreateCardAsync(collectionId, card);
    }

    public Task DeleteCardAsync(string collectionId, string cardId) => repository.DeleteCardAsync(collectionId, cardId);

    public async Task<bool> UpdateCardAsync(string collectionId, Card card)
    {
        card.Embedding = await TryGetEmbeddingAsync(card);
        return await repository.UpdateCardAsync(collectionId, card);
    }

    public Task<List<Card>> SearchCardsAsync(string query) => repository.SearchCardsAsync(query);

    private async Task<List<float>?> TryGetEmbeddingAsync(Card card)
    {
        try
        {
            return await embeddingService.GetDocumentEmbeddingAsync(card.ToEmbeddingText());
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error generating embedding for card {CardId}", card.Id);
            return null;
        }
    }
}
