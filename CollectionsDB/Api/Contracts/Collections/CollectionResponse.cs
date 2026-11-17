using CollectionsDB.Api.Contracts.Cards;

namespace CollectionsDB.Api.Contracts.Collections;

public sealed record CollectionResponse(
    string Id,
    string UserId,
    string Title,
    string Description,
    string Emoji,
    string Kind,
    List<CardResponse> Cards);
