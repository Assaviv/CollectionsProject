using CollectionsDB.Application.Users;
using CollectionsDB.Domain.Cards;
using CollectionsDB.Domain.Collections;
using CollectionsDB.Persistence.Repositories;
using CollectionsDB.Services.Embeddings;

namespace CollectionsDB.Application.Collections;

public sealed class CollectionsService(
    ICollectionsRepository repository,
    EmbeddingService embeddingService,
    ICurrentUser currentUser,
    ILogger<CollectionsService> logger) : ICollectionsService
{
    private string InboxIdOfCurrentUser => InboxId.For(currentUser.UserId);

    public async Task<List<Collection>> GetCollectionsAsync()
    {
        await EnsureInboxAsync();
        var collections = await repository.GetCollectionsAsync();

        // The inbox is pinned first; the rest keep their insertion order.
        return collections.OrderBy(c => c.Kind == CollectionKind.INBOX ? 0 : 1).ToList();
    }

    public Task<Collection?> GetCollectionAsync(string id) => repository.GetCollectionAsync(id);

    public Task CreateCollectionAsync(Collection collection)
    {
        ApplyKind(collection);
        return repository.CreateCollectionAsync(collection);
    }

    public async Task<Collection> EnsureInboxAsync()
    {
        var id = InboxIdOfCurrentUser;
        var inbox = new Collection
        {
            Id = id,
            Kind = CollectionKind.INBOX,
            Title = "Inbox",
            Description = "New and shared cards land here until you move them to a collection.",
            Emoji = "📥",
        };

        if (await repository.CollectionExistsAsync(id) || !await repository.TryCreateInboxAsync(inbox))
        {
            return inbox;
        }

        // First inbox for this user: adopt the cards of the old shared inbox if this user owned it.
        // The tenant filter makes the legacy row invisible to everyone else.
        await repository.AdoptCardsAndDeleteAsync(InboxId.Legacy, id);
        logger.LogInformation("Created inbox {InboxId}", id);
        return inbox;
    }

    public Task<bool> MoveCardAsync(string cardId, string targetCollectionId, string rank) =>
        repository.MoveCardAsync(cardId, targetCollectionId, rank);

    public Task UpdateCollectionAsync(string id, Collection collection)
    {
        collection.Id = id;
        ApplyKind(collection);
        return repository.UpdateCollectionAsync(id, collection);
    }

    public async Task<bool> RemoveCollectionAsync(string id)
    {
        if (id == InboxIdOfCurrentUser)
        {
            return false;
        }

        await repository.RemoveCollectionAsync(id);
        return true;
    }

    // Kind is never trusted from the client: only the user's own inbox id is an inbox.
    private void ApplyKind(Collection collection) =>
        collection.Kind = collection.Id == InboxIdOfCurrentUser ? CollectionKind.INBOX : CollectionKind.NORMAL;

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
