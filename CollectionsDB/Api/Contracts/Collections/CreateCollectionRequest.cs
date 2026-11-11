using CollectionsDB.Api.Contracts.Cards;

namespace CollectionsDB.Api.Contracts.Collections;

public sealed record CreateCollectionRequest(
    string Id,
    string Title,
    string Description,
    string Emoji,
    List<CardRequest> Cards);
