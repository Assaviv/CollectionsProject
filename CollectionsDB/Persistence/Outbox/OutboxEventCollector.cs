using CollectionsDB.Domain.Cards;
using CollectionsDB.Domain.Collections;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using SaveApp.Contracts.Events;
using System.Text.Json;

namespace CollectionsDB.Persistence.Outbox;

/// <summary>
/// Turns the pending changes of a DbContext into outbox rows. Runs inside SaveChanges,
/// before the save, so it sees Added/Modified/Deleted states. Changes made with
/// ExecuteUpdate/ExecuteDelete bypass the change tracker and emit nothing, so the
/// repository uses tracked updates for anything that must produce an event.
/// </summary>
internal static class OutboxEventCollector
{
    private const string UserIdProperty = "UserId";

    public static List<OutboxMessage> Collect(ChangeTracker changeTracker)
    {
        var messages = new List<OutboxMessage>();

        // Collections first, so a consumer sees a new collection before the cards in it.
        // (Different topics aren't ordered against each other; this only helps in practice.)
        foreach (var entry in changeTracker.Entries<Collection>())
        {
            CollectCollection(entry, messages);
        }

        foreach (var entry in changeTracker.Entries<Card>())
        {
            CollectCard(entry, messages);
        }

        return messages;
    }

    private static void CollectCollection(EntityEntry<Collection> entry, List<OutboxMessage> messages)
    {
        var c = entry.Entity;
        switch (entry.State)
        {
            case EntityState.Added:
            case EntityState.Modified when Changed(entry, nameof(Collection.Title), nameof(Collection.Description),
                                                   nameof(Collection.Emoji), nameof(Collection.Kind)):
                messages.Add(Create(Topics.Collections, c.Id, EventTypes.CollectionUpserted, c.UserId,
                    new CollectionUpsertedPayload(c.Id, c.Title, c.Description, c.Emoji, c.Kind.ToString())));
                break;

            case EntityState.Deleted:
                messages.Add(Create(Topics.Collections, c.Id, EventTypes.CollectionDeleted, c.UserId,
                    new CollectionDeletedPayload(c.Id)));
                break;
        }
    }

    private static void CollectCard(EntityEntry<Card> entry, List<OutboxMessage> messages)
    {
        var card = entry.Entity;
        var userId = (string)entry.Property(UserIdProperty).CurrentValue!;

        switch (entry.State)
        {
            case EntityState.Added:
                messages.Add(Upserted(EventTypes.CardCreated, card, userId));
                break;

            case EntityState.Deleted:
                var collectionId = (string)entry.OriginalValues[nameof(Card.CollectionId)]!;
                messages.Add(Create(Topics.Cards, card.Id, EventTypes.CardDeleted, userId,
                    new CardDeletedPayload(card.Id, collectionId)));
                break;

            case EntityState.Modified:
                var from = (string)entry.OriginalValues[nameof(Card.CollectionId)]!;
                if (from != card.CollectionId)
                {
                    messages.Add(Create(Topics.Cards, card.Id, EventTypes.CardMoved, userId,
                        new CardMovedPayload(card.Id, from, card.CollectionId, IsInbox(card.CollectionId, userId))));
                }

                // Position-only changes (reordering) are not interesting to consumers.
                if (ContentChanged(entry) || Changed(entry, nameof(Card.IsFavorite), nameof(Card.IsArchived)))
                {
                    messages.Add(Upserted(EventTypes.CardUpdated, card, userId));
                }
                break;
        }
    }

    private static OutboxMessage Upserted(string type, Card card, string userId) =>
        Create(Topics.Cards, card.Id, type, userId, new CardUpsertedPayload(
            card.Id,
            card.CollectionId,
            IsInbox(card.CollectionId, userId),
            card.CardType.ToString(),
            card.Key,
            card.Value,
            card.IsFavorite,
            card.IsArchived,
            CardContent.Hash(card.CardType.ToString(), card.Key, card.Value)));

    // Compares hashes instead of IsModified: SetValues can flag the jsonb Value as
    // modified even when the JSON is the same.
    private static bool ContentChanged(EntityEntry<Card> entry)
    {
        var original = CardContent.Hash(
            entry.OriginalValues[nameof(Card.CardType)]!.ToString()!,
            (string)entry.OriginalValues[nameof(Card.Key)]!,
            (JsonElement?)entry.OriginalValues[nameof(Card.Value)]);
        var card = entry.Entity;
        return original != CardContent.Hash(card.CardType.ToString(), card.Key, card.Value);
    }

    private static bool Changed(EntityEntry entry, params string[] properties) =>
        properties.Any(p => !Equals(entry.OriginalValues[p], entry.CurrentValues[p]));

    private static bool IsInbox(string collectionId, string userId) => collectionId == InboxId.For(userId);

    private static OutboxMessage Create<T>(string topic, string key, string type, string userId, T payload)
    {
        var envelope = EventEnvelope.Create(type, userId, payload);
        return new OutboxMessage
        {
            EventId = envelope.EventId,
            Topic = topic,
            Key = key,
            Type = type,
            Payload = EventJson.Serialize(envelope),
            OccurredAt = envelope.OccurredAt,
        };
    }
}
