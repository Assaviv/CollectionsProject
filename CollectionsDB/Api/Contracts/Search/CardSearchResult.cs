using CollectionsDB.Domain.Cards;

namespace CollectionsDB.Api.Contracts.Search;

public sealed record CardSearchResult(Card Card, double Similarity);
