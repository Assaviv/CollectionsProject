using CollectionsDB.Data;
using CollectionsDB.Models;
using CollectionsDB.Services.Ai;
using Microsoft.EntityFrameworkCore;
using Pgvector;
using Pgvector.EntityFrameworkCore;

namespace CollectionsDB.Repositories;

/// <summary>
/// EF Core implementation of the collections API.
/// collections (1) -> (n) cards (1) -> (0..1) card_embeddings
/// </summary>
public sealed class EfCollectionsRepository(
    CollectionsDBContext db,
    EmbeddingService embeddingService) : CollectionsApiInterface
{
    private const int EmbeddingDimensions = 768;

    // Cards come back ordered, embeddings are never loaded.
    private IQueryable<Collection> CollectionsWithCards => db.Collections
        .AsNoTracking()
        .Include(c => c.Cards.OrderBy(card => card.Position));

    public List<Collection> GetCollections() =>
        CollectionsWithCards
            .OrderBy(c => EF.Property<long>(c, "Ordinal"))
            .ToList();

    public Collection? GetCollection(string id) =>
        CollectionsWithCards.FirstOrDefault(c => c.Id == id);

    public void CreateCollection(Collection newCollection)
    {
        AssignPositions(newCollection);
        db.Collections.Add(newCollection);

        foreach (var card in newCollection.Cards)
        {
            UpsertEmbedding(card);
        }

        db.SaveChanges();
    }

    // Upsert: updates the collection and syncs its cards (add / update / remove).
    public void UpdateCollection(string id, Collection updatedCollection)
    {
        var existing = db.Collections
            .Include(c => c.Cards)
            .FirstOrDefault(c => c.Id == id);

        if (existing is null)
        {
            updatedCollection.Id = id;
            CreateCollection(updatedCollection);
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

        db.SaveChanges();
    }

    public void RemoveCollection(string id) =>
        db.Collections.Where(c => c.Id == id).ExecuteDelete(); // cards + embeddings cascade

    public void CreateCard(string id, Card newCard)
    {
        if (!db.Collections.Any(c => c.Id == id))
        {
            return;
        }

        var lastPosition = db.Cards
            .Where(c => c.CollectionId == id)
            .Max(c => (int?)c.Position) ?? -1;

        newCard.CollectionId = id;
        newCard.Position = lastPosition + 1;
        db.Cards.Add(newCard);
        UpsertEmbedding(newCard);
        db.SaveChanges();
    }

    // Leaves a gap in Position, which is fine: ordering stays correct.
    public void DeleteCard(string collectionId, string cardId) =>
        db.Cards
            .Where(c => c.CollectionId == collectionId && c.Id == cardId)
            .ExecuteDelete();

    public List<Card> SearchCards(string query)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(query);

        // Interface is synchronous, so bridge the async embedding call here.
        var embedding = embeddingService.GetEmbeddingAsync(query).GetAwaiter().GetResult();
        if (embedding.Count != EmbeddingDimensions)
        {
            throw new InvalidOperationException(
                $"Expected a {EmbeddingDimensions}-dimensional embedding, but received {embedding.Count} values.");
        }

        var queryVector = new Vector(embedding.ToArray());

        // Indexed nearest-neighbour search (HNSW), then join to the card.
        return db.CardEmbeddings
            .AsNoTracking()
            .OrderBy(e => e.Embedding.L2Distance(queryVector)) // same as <->
            .Take(5)
            .Select(e => e.Card)
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

    public bool UpdateCard(string collectionId, Card updatedCard)
    {
        var current = db.Cards.FirstOrDefault(c => c.Id == updatedCard.Id && c.CollectionId == collectionId);
        if (current is null)
        {
            return false;
        }

        updatedCard.CollectionId = collectionId;
        updatedCard.Position = current.Position;               // keep its place in the collection
        db.Entry(current).CurrentValues.SetValues(updatedCard);
        UpsertEmbedding(updatedCard);                          // no-op if no new embedding was supplied
        db.SaveChanges();
        return true;
    }
}