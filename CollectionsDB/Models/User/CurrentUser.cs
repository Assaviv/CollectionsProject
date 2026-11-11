using System.Text.Json;

namespace CollectionsDB.Models.User;

public class CurrentUser : ICurrentUser
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private sealed record HeaderProfile(string? id, string? name);

    private readonly HeaderProfile? _profile;

    public CurrentUser(IHttpContextAccessor accessor, ILogger<CurrentUser> logger)
    {
        _profile = ReadProfile(accessor.HttpContext, logger);
    }

    public string UserId =>
        !string.IsNullOrWhiteSpace(_profile?.id)
            ? _profile!.id!
            : throw new UnauthorizedAccessException("No user id on the request.");

    public string Username => _profile?.name ?? string.Empty;

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
