using CollectionsDB.Persistence.Outbox;
using Microsoft.Extensions.Options;

namespace CollectionsDB.Infrastructure.Outbox;

/// <summary>Deletes sent outbox rows older than <see cref="OutboxOptions.Retention"/>, once per interval.</summary>
public sealed class OutboxCleanup(
    IServiceScopeFactory scopeFactory,
    IOptions<OutboxOptions> options,
    ILogger<OutboxCleanup> logger) : BackgroundService
{
    private readonly OutboxOptions _options = options.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(_options.CleanupInterval);
        do
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var store = scope.ServiceProvider.GetRequiredService<OutboxStore>();
                var deleted = await store.DeleteSentBeforeAsync(DateTimeOffset.UtcNow - _options.Retention, stoppingToken);
                if (deleted > 0)
                {
                    logger.LogInformation("Deleted {Count} sent outbox rows older than {Retention}", deleted, _options.Retention);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Outbox cleanup failed; will try again next interval");
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
