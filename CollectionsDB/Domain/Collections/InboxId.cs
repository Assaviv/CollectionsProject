using System.Security.Cryptography;
using System.Text;

namespace CollectionsDB.Domain.Collections;

/// <summary>
/// Deterministic per-user inbox id: a name-based UUIDv5 of the user id. It is
/// 36 characters long, so it fits the existing <c>{id:length(36)}</c> routes, and
/// every device of the same user computes the same id.
/// </summary>
public static class InboxId
{
    // Id of the old shared inbox (before inboxes were per user). Its cards are
    // adopted by the owner's new inbox the first time EnsureInbox runs.
    public const string Legacy = "inbox0000000000000000000000000000000";

    // Fixed namespace for SaveApp inbox ids (random, never change it).
    private static readonly Guid Namespace = new("6f1c2b7e-3d4a-4f6b-9a8e-2c5d7e9f1a3b");

    public static string For(string userId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(userId);

        var namespaceBytes = Namespace.ToByteArray(bigEndian: true);
        var nameBytes = Encoding.UTF8.GetBytes(userId);

        var hash = SHA1.HashData([.. namespaceBytes, .. nameBytes]);
        var bytes = hash[..16];
        bytes[6] = (byte)((bytes[6] & 0x0F) | 0x50); // version 5
        bytes[8] = (byte)((bytes[8] & 0x3F) | 0x80); // RFC 4122 variant

        return new Guid(bytes, bigEndian: true).ToString();
    }
}
