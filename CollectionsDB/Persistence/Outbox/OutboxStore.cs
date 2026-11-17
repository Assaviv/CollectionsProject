using CollectionsDB.Application.Events;
using Microsoft.EntityFrameworkCore;

namespace CollectionsDB.Persistence.Outbox;

/// <summary>
/// Database side of the outbox: reading pending rows in order, marking them sent, and
/// purging old ones. It knows nothing about Kafka: sending is a callback.
/// </summary>
public sealed class OutboxStore(CollectionsDBContext db)
{
    // Arbitrary constant shared by every instance of this service.
    private const long RelayLockKey = 0x5A_7E_0B_0C;

    /// <summary>
    /// Sends up to <paramref name="batchSize"/> pending rows through <paramref name="send"/>,
    /// oldest first, inside one transaction.
    /// <list type="bullet">
    /// <item>A transaction-scoped advisory lock means only one instance sends at a time,
    /// which keeps the order. If another instance holds it, nothing happens.</item>
    /// <item>It stops at the first failed send and records the error on that row, so a
    /// later event for the same card can never overtake an earlier one. Then it rethrows.</item>
    /// </list>
    /// </summary>
    /// <returns>How many rows were sent.</returns>
    public async Task<int> SendPendingAsync(
        int batchSize,
        Func<OutgoingEvent, CancellationToken, Task> send,
        CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        var isOnlySender = await db.Database
            .SqlQuery<bool>($"SELECT pg_try_advisory_xact_lock({RelayLockKey}) AS \"Value\"")
            .SingleAsync(ct);
        if (!isOnlySender)
        {
            return 0;
        }

        var pending = await db.OutboxMessages
            .Where(m => m.PublishedAt == null)
            .OrderBy(m => m.Sequence)
            .Take(batchSize)
            .ToListAsync(ct);

        var sent = 0;
        Exception? failure = null;
        foreach (var message in pending)
        {
            try
            {
                await send(ToOutgoing(message), ct);
                message.PublishedAt = DateTimeOffset.UtcNow;
                sent++;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                message.Attempts++;
                message.LastError = ex.Message;
                failure = ex;
                break;
            }
        }

        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        return failure is null ? sent : throw failure;
    }

    /// <summary>Deletes rows that were sent before <paramref name="cutoff"/>.</summary>
    public Task<int> DeleteSentBeforeAsync(DateTimeOffset cutoff, CancellationToken ct) =>
        db.OutboxMessages
            .Where(m => m.PublishedAt != null && m.PublishedAt < cutoff)
            .ExecuteDeleteAsync(ct);

    private static OutgoingEvent ToOutgoing(OutboxMessage m) =>
        new(m.EventId, m.Topic, m.Key, m.Type, m.Payload, m.OccurredAt);
}
