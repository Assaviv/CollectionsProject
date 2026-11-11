using CollectionsDB.Domain.Cards;

namespace CollectionsDB.Api.Contracts.Collections;

public sealed record CreateCollectionRequest(
    string Id,
    string Title,
    string Description,
    string Emoji,
    List<Card> Cards);
