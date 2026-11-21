namespace CollectionsDB.Api.Contracts.Cards;

/// <summary>Body of POST …/Cards/{cardId}/move: the card's rank in the target, chosen by the client.</summary>
public sealed record MoveCardRequest(string Rank);
