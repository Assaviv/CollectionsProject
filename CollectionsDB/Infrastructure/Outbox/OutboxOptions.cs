namespace CollectionsDB.Infrastructure.Outbox;

/// <summary>Config section <c>Outbox</c>. All values have working defaults.</summary>
public sealed class OutboxOptions
{
    public const string Section = "Outbox";

    /// <summary>How often the relay checks for rows when no save has woken it.</summary>
    public TimeSpan PollInterval { get; set; } = TimeSpan.FromSeconds(2);

    /// <summary>Wait after a failed send (Kafka unreachable) before trying again.</summary>
    public TimeSpan RetryDelay { get; set; } = TimeSpan.FromSeconds(5);

    public int BatchSize { get; set; } = 100;

    /// <summary>Sent rows are deleted after this long.</summary>
    public TimeSpan Retention { get; set; } = TimeSpan.FromDays(7);

    public TimeSpan CleanupInterval { get; set; } = TimeSpan.FromHours(1);
}
