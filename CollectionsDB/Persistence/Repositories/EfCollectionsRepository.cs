using CollectionsDB.Api.Contracts.Search;
using CollectionsDB.Domain.Cards;
using CollectionsDB.Domain.Collections;
using CollectionsDB.Persistence;
using CollectionsDB.Services.Embeddings;
using Microsoft.EntityFrameworkCore;
using Npgsql;
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

    // Cards come back ordered by (Rank, Id), embeddings are never loaded. Rank already has collation "C";
    // Id gets it here so ties break the same way as on the client (IndexedDB compares by code unit).
    private IQueryable<Collection> CollectionsWithCards => db.Collections
        .AsNoTracking()
        .Include(c => c.Cards.OrderBy(card => card.Rank).ThenBy(card => EF.Functions.Collate(card.Id, "C")));

    public Task<List<Collection>> GetCollectionsAsync() =>
        CollectionsWithCards
            .OrderBy(c => EF.Property<long>(c, "Ordinal"))
            .ToListAsync();

    public Task<Collection?> GetCollectionAsync(string id) =>
        CollectionsWithCards.FirstOrDefaultAsync(c => c.Id == id);

    public Task<bool> CollectionExistsAsync(string id) =>
        db.Collections.AnyAsync(c => c.Id == id);

    public async Task<bool> TryCreateInboxAsync(Collection inbox)
    {
        db.Collections.Add(inbox);
        try
        {
            await db.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Another request created it first. Forget our copy so the context stays usable.
            db.Entry(inbox).State = EntityState.Detached;
            return false;
        }
    }

    public async Task AdoptCardsAndDeleteAsync(string fromId, string toId)
    {
        if (!await db.Collections.AnyAsync(c => c.Id == fromId))
        {
            return;
        }

        await using var transaction = await db.Database.BeginTransactionAsync();

        // The target is a brand-new (empty) inbox, so the cards keep their ranks.
        await db.Cards
            .Where(c => c.CollectionId == fromId)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.CollectionId, toId));

        await db.Collections.Where(c => c.Id == fromId).ExecuteDeleteAsync();
        await transaction.CommitAsync();
    }

    public async Task CreateCollectionAsync(Collection newCollection)
    {
        if (await db.Collections.AnyAsync(c => c.Id == newCollection.Id))
        {
            return;
        }

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

        foreach (var incoming in updatedCollection.Cards)
        {
            incoming.CollectionId = id;

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

        if (await db.Cards.AnyAsync(c => c.Id == newCard.Id))
        {
            return;
        }

        newCard.CollectionId = id;
        db.Cards.Add(newCard);
        UpsertEmbedding(newCard);
        await db.SaveChangesAsync();
    }

    public async Task DeleteCardAsync(string collectionId, string cardId) =>
        await db.Cards
            .Where(c => c.CollectionId == collectionId && c.Id == cardId)
            .ExecuteDeleteAsync();

    public async Task<bool> MoveCardAsync(string cardId, string targetCollectionId, string rank)
    {
        var card = await db.Cards.FirstOrDefaultAsync(c => c.Id == cardId);
        if (card is null || !await db.Collections.AnyAsync(c => c.Id == targetCollectionId))
        {
            return false;
        }

        card.Rank = rank;                      // same target + rank again is a no-op: idempotent for outbox retries
        card.CollectionId = targetCollectionId;
        await db.SaveChangesAsync();
        return true;
    }

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
        updatedCard.Rank = current.Rank;                       // content only: the rank changes through move
        db.Entry(current).CurrentValues.SetValues(updatedCard);
        UpsertEmbedding(updatedCard);                          // no-op if no new embedding was supplied
        await db.SaveChangesAsync();
        return true;
    }
}
