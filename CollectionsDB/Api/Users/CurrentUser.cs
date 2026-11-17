using System.Text.Json;

using CollectionsDB.Application.Users;

namespace CollectionsDB.Api.Users;

/// <summary>
/// Scoped user of the current unit of work. On HTTP requests it comes from the
/// X-Profile header the gateway sets. Background work calls <see cref="Set"/>
/// with the user id taken from the message it is processing.
/// </summary>
public class CurrentUser : IUserContext
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private sealed record HeaderProfile(string? id, string? name);

    private HeaderProfile? _profile;

    public CurrentUser(IHttpContextAccessor accessor, ILogger<CurrentUser> logger)
    {
        _profile = ReadProfile(accessor.HttpContext, logger);
    }

    public string UserId =>
        !string.IsNullOrWhiteSpace(_profile?.id)
            ? _profile!.id!
            : throw new UnauthorizedAccessException("No user id on the request.");

    public string Username => _profile?.name ?? string.Empty;

    public void Set(string userId, string? username = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(userId);
        _profile = new HeaderProfile(userId, username);
    }

    private static HeaderProfile? ReadProfile(HttpContext? context, ILogger logger)
    {
        var header = context?.Request.Headers["X-Profile"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(header)) return null;

        try
        {
            return JsonSerializer.Deserialize<HeaderProfile>(header, JsonOptions);
        }
        catch (JsonException ex)
        {
            logger.LogWarning(ex, "Received an invalid X-Profile header");
            return null;
        }
    }
}
