using CollectionsDB.Domain.Cards;

namespace CollectionsDB.Application.Rag;

public interface IRagService
{
    Task<List<Card>> SearchCardsAsync(string query);
    IAsyncEnumerable<string> StreamAnswerAsync(
        string question,
        IReadOnlyList<Card> results,
        CancellationToken cancellationToken = default);
}
