using CollectionsDB.Application.Events;
using CollectionsDB.Persistence.Outbox;
using Microsoft.Extensions.Options;

namespace CollectionsDB.Infrastructure.Outbox;

/// <summary>
/// Background loop that moves outbox rows to the broker: wait for a save (or the poll
/// interval), then let <see cref="OutboxStore"/> send pending rows through
/// <see cref="IEventPublisher"/> until none are left. On failure, wait and retry.
/// Delivery is at-least-once; consumers drop duplicates by eventId.
/// </summary>
public sealed class OutboxRelay(
    IServiceScopeFactory scopeFactory,
    IEventPublisher publisher,
    OutboxSignal signal,
    IOptions<OutboxOptions> options,
    ILogger<OutboxRelay> logger) : BackgroundService
{
    private readonly OutboxOptions _options = options.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SendAllPendingAsync(stoppingToken);
                await signal.WaitAsync(_options.PollInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Sending outbox events failed, retrying in {Delay}", _options.RetryDelay);
                await Task.Delay(_options.RetryDelay, stoppingToken);
            }
        }
    }

    private async Task SendAllPendingAsync(CancellationToken ct)
    {
        int sent;
        do
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var store = scope.ServiceProvider.GetRequiredService<OutboxStore>();
            sent = await store.SendPendingAsync(_options.BatchSize, publisher.PublishAsync, ct);
        } while (sent == _options.BatchSize); // a full batch means there may be more
    }
}
