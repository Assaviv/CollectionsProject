namespace CollectionsDB.Domain.Cards;

/// <summary>
/// Server side of the card rank (fractional index). Ranks use the same format as the npm package
/// <c>fractional-indexing</c>, which the client uses to pick ranks between two cards.
/// The server only ever appends (share inbox, cards sent without a rank), so it only needs
/// <see cref="AppendAfter"/>, a port of that package's <c>generateKeyBetween(last, null)</c>.
/// Ranks sort with ordinal (byte) comparison: the column uses <c>COLLATE "C"</c>.
/// </summary>
/// <remarks>
/// Temporary: once the mobile share flow goes through the Angular app, the server stops creating
/// ranks and only validates them.
/// </remarks>
public static class RankKey
{
    private const string Digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    private static readonly string Smallest = "A" + new string('0', 26);

    /// <summary>The rank of the first card in an empty collection.</summary>
    public const string First = "a0";

    /// <summary>A rank that sorts after <paramref name="last"/>, or <see cref="First"/> when there is none.</summary>
    public static string AppendAfter(string? last)
    {
        if (string.IsNullOrEmpty(last))
        {
            return First;
        }

        if (!IsValid(last))
        {
            throw new ArgumentException($"Invalid rank '{last}'.", nameof(last));
        }

        var integer = last[..IntegerLength(last[0])];
        return Increment(integer)
            // Only after 62^26 appends at the top integer length; never reached in practice.
            ?? throw new InvalidOperationException("Rank space exhausted.");
    }

    /// <summary>True if <paramref name="rank"/> is a well-formed rank the client library accepts.</summary>
    public static bool IsValid(string? rank)
    {
        if (string.IsNullOrEmpty(rank) || rank == Smallest || !rank.All(c => Digits.Contains(c)))
        {
            return false;
        }

        var head = rank[0];
        if (head is not (>= 'a' and <= 'z' or >= 'A' and <= 'Z'))
        {
            return false;
        }

        var integerLength = IntegerLength(head);
        // The fractional part (after the integer part) must not end with the smallest digit.
        return rank.Length >= integerLength && (rank.Length == integerLength || rank[^1] != Digits[0]);
    }

    // 'a' → 2 chars ("a0".."az"), 'b' → 3, …; 'Z' → 2, 'Y' → 3, … (upper case heads sort before lower case).
    private static int IntegerLength(char head) =>
        head >= 'a' ? head - 'a' + 2 : 'Z' - head + 2;

    private static string? Increment(string integer)
    {
        var head = integer[0];
        var digits = integer[1..].ToCharArray();

        for (var i = digits.Length - 1; i >= 0; i--)
        {
            var next = Digits.IndexOf(digits[i]) + 1;
            if (next < Digits.Length)
            {
                digits[i] = Digits[next];
                return head + new string(digits);
            }

            digits[i] = Digits[0];
        }

        // Every digit carried over: move to the next integer length.
        if (head == 'Z')
        {
            return "a" + Digits[0];
        }

        if (head == 'z')
        {
            return null;
        }

        var nextHead = (char)(head + 1);
        var nextDigits = nextHead > 'a'
            ? new string(digits) + Digits[0]   // lower case: one digit longer
            : new string(digits)[..^1];        // upper case: one digit shorter
        return nextHead + nextDigits;
    }
}
