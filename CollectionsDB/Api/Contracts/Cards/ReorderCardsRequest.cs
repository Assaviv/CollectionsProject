namespace CollectionsDB.Api.Contracts.Cards;

/// <summary>The collection's card ids in their new order.</summary>
public sealed record ReorderCardsRequest(List<string> CardIds);
