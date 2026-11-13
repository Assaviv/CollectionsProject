using System.Text.Json;
using CollectionsDB.Api.Contracts.Cards;
using CollectionsDB.Api.Contracts.Search;
using CollectionsDB.Application.Rag;
using Microsoft.AspNetCore.Mvc;

namespace CollectionsDB.Controllers;

[ApiController]
[Route("api/RAG")]
public sealed class RAGController(IRagService ragService) : ControllerBase
{
    private static readonly JsonSerializerOptions SseJsonOptions = new(JsonSerializerDefaults.Web);

    /// <summary>
    /// Searches saved memories, then streams the generated answer as server-sent events.
    /// The first event contains the retrieved cards, followed by one event per generated text chunk.
    /// </summary>
    [HttpPost("search")]
    [Produces("text/event-stream")]
    public async Task Search([FromBody] SearchCardsRequest request)
    {
        var query = request.Query;
        if (string.IsNullOrWhiteSpace(query))
        {
            Response.StatusCode = StatusCodes.Status400BadRequest;
            await Response.WriteAsync("The search query is null or empty.");
            return;
        }

        var results = await ragService.SearchCardsAsync(query);
        // TODO: use CollectionMapper, and get the related collection Id as well
        var cards = results.Select(card => new CardResponse(
            card.Id,
            CollectionId: "",
            card.Key,
            card.Value,
            CardTypeContract.SUBJECT,
            IsFavorite: false,
            IsArchived: false,
            Position: -1)).ToList();

        Response.StatusCode = StatusCodes.Status200OK;
        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache, no-transform";
        Response.Headers.Append("X-Accel-Buffering", "no");

        await Response.StartAsync(HttpContext.RequestAborted);
        await WriteSseEventAsync("cards", JsonSerializer.Serialize(cards, SseJsonOptions), HttpContext.RequestAborted);

        try
        {
            await GenerateTokens(query, results);
        }
        catch (OperationCanceledException) when (HttpContext.RequestAborted.IsCancellationRequested)
        {
            // Stop generation when the client closes the stream.
        }
        catch (Exception)
        {
            await WriteSseEventAsync(
                "error", JsonSerializer.Serialize("Answer generation failed."), CancellationToken.None);
        }
    }

    private async Task GenerateTokens(string query, List<Domain.Cards.Card> results)
    {
        await foreach (var token in ragService.StreamAnswerAsync(
                           query, results, HttpContext.RequestAborted))
        {
            await WriteSseEventAsync("token", JsonSerializer.Serialize(token), HttpContext.RequestAborted);
        }

        await WriteSseEventAsync("done", "{}", HttpContext.RequestAborted);
    }

    private async Task WriteSseEventAsync(string eventName, string data, CancellationToken cancellationToken)
    {
        await Response.WriteAsync($"event: {eventName}\ndata: {data}\n\n", cancellationToken);
        await Response.Body.FlushAsync(cancellationToken);
    }
}
