namespace CollectionsDB.Persistence.Outbox;

/// <summary>
/// Wakes the publisher right after a save that wrote outbox rows, so events go out in
/// milliseconds instead of waiting for the next poll. Missing a signal is harmless:
/// the publisher also polls.
/// </summary>
public sealed class OutboxSignal
{
    private readonly SemaphoreSlim _semaphore = new(0, 1);

    public void Notify()
    {
        if (_semaphore.CurrentCount == 0)
        {
            try { _semaphore.Release(); } catch (SemaphoreFullException) { /* already signalled */ }
        }
    }

    public Task<bool> WaitAsync(TimeSpan timeout, CancellationToken cancellationToken) =>
        _semaphore.WaitAsync(timeout, cancellationToken);
}
