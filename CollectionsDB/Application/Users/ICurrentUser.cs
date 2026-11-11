namespace CollectionsDB.Application.Users;

public interface ICurrentUser
{
    string UserId { get; }
    string Username { get; }
}
