namespace CollectionsDB.Models.User;

public interface ICurrentUser
{
    string UserId { get; }
    string Username { get; }
}
