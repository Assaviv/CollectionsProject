using CollectionsDB.Api.Contracts.Cards;

namespace CollectionsDB.Api.Contracts.Collections;

public sealed record UpdateCollectionRequest(
    string Id,
    string UserId,
    string Title,
    string Description,
    string Emoji,
    List<CardRequest> Cards);
