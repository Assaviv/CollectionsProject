using FractionalIndexing;

namespace CollectionsDB.Domain.Cards;

/// <summary>
/// Server side of the card rank (fractional index). Key generation comes from the NuGet package
/// <c>FractionalIndexing</c>, the .NET port of the npm package <c>fractional-indexing</c> the client uses,
/// so ranks made on either side sort together. Ranks sort with ordinal (byte) comparison: the column
/// uses <c>COLLATE "C"</c>.
/// </summary>
/// <remarks>
/// The server only ever appends (share inbox, cards sent without a rank). Temporary: once the mobile
/// share flow goes through the Angular app, the server stops creating ranks and only validates them.
/// </remarks>
public static class RankKey
{
    // Same alphabet as the client's BASE_62_DIGITS.
    private const string Digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    /// <summary>A rank that sorts after <paramref name="last"/>, or the first rank ("a0") when there is none.</summary>
    public static string AppendAfter(string? last) =>
        OrderKeyGenerator.GenerateKeyBetween(string.IsNullOrEmpty(last) ? null : last, null, Digits);

    /// <summary>
    /// True if <paramref name="rank"/> is a well-formed key. The library validates a key's structure when it
    /// generates from it, but not the characters of the fractional part, so those are checked here.
    /// </summary>
    public static bool IsValid(string? rank)
    {
        if (string.IsNullOrEmpty(rank) || !rank.All(c => Digits.Contains(c)))
        {
            return false;
        }

        try
        {
            OrderKeyGenerator.GenerateKeyBetween(rank, null, Digits);
            return true;
        }
        catch (ArgumentException)
        {
            return false;
        }
    }
}
