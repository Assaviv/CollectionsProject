namespace CollectionsDB.Application.Users;

public interface ICurrentUser
{
    string UserId { get; }
    string Username { get; }
}

/// <summary>
/// Lets code that runs without an HTTP request (Kafka consumers, background jobs)
/// act as a user inside its own DI scope, so the tenant query filters in
/// CollectionsDBContext keep working unchanged.
/// </summary>
public interface IUserContext : ICurrentUser
{
    void Set(string userId, string? username = null);
}
