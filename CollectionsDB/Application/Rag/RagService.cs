using CollectionsDB.Domain.Cards;
using CollectionsDB.Persistence.Repositories;
using CollectionsDB.Services.Llm;

namespace CollectionsDB.Application.Rag;

public sealed class RagService(
    ICollectionsRepository repository,
    OllamaCardAnswerService answerService) : IRagService
{
    public Task<List<Card>> SearchCardsAsync(string query) => repository.SearchCardsAsync(query);

    public IAsyncEnumerable<string> StreamAnswerAsync(
        string question,
        IReadOnlyList<Card> results,
        CancellationToken cancellationToken = default) =>
        answerService.StreamAnswerAsync(question, results, cancellationToken);
}
