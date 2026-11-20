namespace CollectionsDB.Api.Contracts.Cards;

/// <summary>Body of POST …/Cards/{cardId}/move. Without a valid rank the card goes to the end.</summary>
public sealed record MoveCardRequest(string? Rank);
