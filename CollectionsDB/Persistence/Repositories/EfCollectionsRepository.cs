using CollectionsDB.Api.Contracts.Search;
using CollectionsDB.Domain.Cards;
using CollectionsDB.Domain.Collections;
using CollectionsDB.Persistence;
using CollectionsDB.Services.Embeddings;
using Microsoft.EntityFrameworkCore;
using Pgvector;
using Pgvector.EntityFrameworkCore;

namespace CollectionsDB.Persistence.Repositories;

/// <summary>
/// EF Core implementation of the collections API.
/// collections (1) -> (n) cards (1) -> (0..1) card_embeddings
/// </summary>
public sealed class EfCollectionsRepository(
    CollectionsDBContext db,
    EmbeddingService embeddingService) : ICollectionsRepository
{
    private const int EmbeddingDimensions = 768;

    // Cards come back ordered, embeddings are never loaded.
    private IQueryable<Collection> CollectionsWithCards => db.Collections
        .AsNoTracking()
        .Include(c => c.Cards.OrderBy(card => card.Position));

    public Task<List<Collection>> GetCollectionsAsync() =>
        CollectionsWithCards
            .OrderBy(c => EF.Property<long>(c, "Ordinal"))
            .ToListAsync();

    public Task<Collection?> GetCollectionAsync(string id) =>
        CollectionsWithCards.FirstOrDefaultAsync(c => c.Id == id);

    public async Task CreateCollectionAsync(Collection newCollection)
    {
        AssignPositions(newCollection);
        db.Collections.Add(newCollection);

        foreach (var card in newCollection.Cards)
        {
            UpsertEmbedding(card);
        }

        await db.SaveChangesAsync();
    }

    // Upsert: updates the collection and syncs its cards (add / update / remove).
    public async Task UpdateCollectionAsync(string id, Collection updatedCollection)
    {
        var existing = await db.Collections
            .Include(c => c.Cards)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (existing is null)
        {
            updatedCollection.Id = id;
            await CreateCollectionAsync(updatedCollection);
            return;
        }

        existing.Title = updatedCollection.Title;
        existing.Description = updatedCollection.Description;
        existing.Emoji = updatedCollection.Emoji;

        var incomingIds = updatedCollection.Cards.Select(c => c.Id).ToHashSet();

        // Embeddings of removed cards are deleted by the FK cascade.
        foreach (var removed in existing.Cards.Where(c => !incomingIds.Contains(c.Id)).ToList())
        {
            db.Cards.Remove(removed);
        }

        for (var i = 0; i < updatedCollection.Cards.Count; i++)
        {
            var incoming = updatedCollection.Cards[i];
            incoming.CollectionId = id;
            incoming.Position = i;

            var current = existing.Cards.FirstOrDefault(c => c.Id == incoming.Id);
            if (current is null)
            {
                existing.Cards.Add(incoming);
            }
            else
            {
                db.Entry(current).CurrentValues.SetValues(incoming);
            }

            // Only touches card_embeddings when the caller supplied an embedding.
            UpsertEmbedding(incoming);
        }

        await db.SaveChangesAsync();
    }

    public async Task RemoveCollectionAsync(string id) =>
        await db.Collections.Where(c => c.Id == id).ExecuteDeleteAsync(); // cards + embeddings cascade

    public async Task CreateCardAsync(string id, Card newCard)
    {
        if (!await db.Collections.AnyAsync(c => c.Id == id))
        {
            return;
        }

        var lastPosition = await db.Cards
            .Where(c => c.CollectionId == id)
            .MaxAsync(c => (int?)c.Position) ?? -1;

        newCard.CollectionId = id;
        newCard.Position = lastPosition + 1;
        db.Cards.Add(newCard);
        UpsertEmbedding(newCard);
        await db.SaveChangesAsync();
    }

    // Leaves a gap in Position, which is fine: ordering stays correct.
    public async Task DeleteCardAsync(string collectionId, string cardId) =>
        await db.Cards
            .Where(c => c.CollectionId == collectionId && c.Id == cardId)
            .ExecuteDeleteAsync();

    public async Task<List<Card>> SearchCardsAsync(string query, double maxDistance = 0.5, int take = 3)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(query);

        var embedding = await embeddingService.GetQueryEmbeddingAsync(query);
        if (embedding.Count != EmbeddingDimensions)
            throw new InvalidOperationException(
                $"Expected a {EmbeddingDimensions}-dimensional embedding, but received {embedding.Count} values.");

        var queryVector = new Vector(embedding.ToArray());

        // Let the HNSW index do ORDER BY + LIMIT, then apply the threshold on the small result set.
        var candidates = await db.CardEmbeddings
            .AsNoTracking()
            .Select(e => new { e.Card, Distance = e.Embedding.CosineDistance(queryVector) })
            .OrderBy(x => x.Distance)
            .Take(10)
            .ToListAsync();

        return candidates
            .Where(x => x.Distance <= maxDistance)
            .Take(take)
            .Select(x => new CardSearchResult(x.Card, 1 - x.Distance).Card)
            .ToList();
    }

    private static void AssignPositions(Collection collection)
    {
        for (var i = 0; i < collection.Cards.Count; i++)
        {
            collection.Cards[i].Position = i;
        }
    }

    private void UpsertEmbedding(Card card)
    {
        if (card.Embedding is null)
        {
            return;
        }

        if (card.Embedding.Count != EmbeddingDimensions)
        {
            throw new InvalidOperationException(
                $"Expected a {EmbeddingDimensions}-dimensional embedding, but received {card.Embedding.Count} values.");
        }

        var vector = new Vector(card.Embedding.ToArray());
        var existing = db.CardEmbeddings.Find(card.Id);

        if (existing is null)
        {
            db.CardEmbeddings.Add(new CardEmbedding { CardId = card.Id ?? throw new Exception("Null ID"), Embedding = vector });
        }
        else
        {
            existing.Embedding = vector;
        }
    }

    public async Task<bool> UpdateCardAsync(string collectionId, Card updatedCard)
    {
        var current = await db.Cards.FirstOrDefaultAsync(c => c.Id == updatedCard.Id && c.CollectionId == collectionId);
        if (current is null)
        {
            return false;
        }

        updatedCard.CollectionId = collectionId;
        updatedCard.Position = current.Position;               // keep its place in the collection
        db.Entry(current).CurrentValues.SetValues(updatedCard);
        UpsertEmbedding(updatedCard);                          // no-op if no new embedding was supplied
        await db.SaveChangesAsync();
        return true;
    }
}
