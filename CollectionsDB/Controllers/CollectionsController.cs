using CollectionsDB.Repositories;
using CollectionsDB.Models;
using CollectionsDB.Services.Ai;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using CollectionsDB.Data;

namespace CollectionsDB.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CollectionsController : ControllerBase
{
    private readonly CollectionsApiInterface _collectionsService;
    private readonly EmbeddingService _embeddingService;
    private readonly ILogger<CollectionsController> _logger;

    public CollectionsController(
        CollectionsApiInterface collectionsService,
        EmbeddingService embeddingService,
        ILogger<CollectionsController> logger)
    {
        _collectionsService = collectionsService;
        _embeddingService = embeddingService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<List<Collection>> Get()
    {
        return await _collectionsService.GetCollectionsAsync();
    }

    [HttpGet("{id:length(36)}")]
    public async Task<ActionResult<Collection>> Get(string id)
    {
        var collection = await _collectionsService.GetCollectionAsync(id);

        if (collection is null)
        {
            return NotFound();
        }

        return collection;
    }

    public record CreateCollectionRequest(
        string Id,
        string Title,
        string Description,
        string Emoji,
        List<Card> Cards
    );

    [HttpPost]
    public async Task<IActionResult> Post(CreateCollectionRequest request) // maybe create?
    {
        var newCollection = new Collection
        {
            Id = request.Id,
            Title = request.Title,
            Description = request.Description,
            Emoji = request.Emoji,
            Cards = request.Cards
            // UserId is stamped by CollectionsDBContext.SaveChangesAsync
        };

        await _collectionsService.CreateCollectionAsync(newCollection);

        return CreatedAtAction(nameof(Get), new { id = newCollection.Id }, newCollection);
    }

    [HttpPost("inbox")]
    public async Task<IActionResult> Inbox([FromBody] InboxDto data)
    {
        //! TODO: build the inbox collection by user id - fix after mobile is secured
        string INBOX_COLLECTION_ID = "inbox0000000000000000000000000000000";
        Card newCard = new Card()
        {
            CardType = data.type == "link" ? CardType.LINK : CardType.SUBJECT,
            Key = data.key ?? data.text.ToString(),
        };

        if (newCard.CardType.Equals(CardType.LINK))
        {
            newCard.Value = data.text;
        }

        var inbox = await _collectionsService.GetCollectionAsync(INBOX_COLLECTION_ID);

        if (inbox is null)
        {
            await _collectionsService.CreateCollectionAsync(new Collection(){Id = INBOX_COLLECTION_ID, Cards=[], Description="This is the collection that is used store all of the shared cards", Title="inbox"});
        }

        newCard.Embedding = await TryGetEmbeddingAsync(newCard);
        await _collectionsService.CreateCardAsync(INBOX_COLLECTION_ID, newCard);

        return Ok();
    }

    [HttpPut("{id:length(36)}")]
    public async Task<IActionResult> Update(string id, Collection updatedcollection)
    {
        var collection = await _collectionsService.GetCollectionAsync(id);

        if (collection is null)
        {
            return NotFound();
        }

        updatedcollection.Id = collection.Id;

        await _collectionsService.UpdateCollectionAsync(id, updatedcollection);

        return NoContent();
    }

    [HttpDelete("{id:length(36)}")]
    public async Task<IActionResult> Delete(string id)
    {
        var collection = await _collectionsService.GetCollectionAsync(id);

        if (collection is null)
        {
            return NotFound();
        }

        await _collectionsService.RemoveCollectionAsync(id);

        return NoContent();
    }

    [HttpPost("{id:length(36)}/Cards")]
    public async Task<IActionResult> InsertCardIntoCollection(string id, Card newCard)
    {
        if (newCard is null)
        {
            return BadRequest("The card was not inserted, card is null");
        }

        newCard.Embedding = await TryGetEmbeddingAsync(newCard);
        await _collectionsService.CreateCardAsync(id, newCard);

        return CreatedAtAction(nameof(Get), new { id }, newCard);
    }

    public record DeleteRequest(string cardId);

    [HttpDelete("{id:length(36)}/Cards")]
    public async Task<IActionResult> DeleteCardFromCollection([FromRoute] string id, [FromBody] DeleteRequest cardId)
    {
        await _collectionsService.DeleteCardAsync(id, cardId.cardId);
        return Ok();
    }

    [HttpPut("{id:length(36)}/Cards")]
    public async Task<IActionResult> UpdateCardInCollection([FromRoute] string id, [FromBody] Card updatedCard)
    { 
        // TODO: There are 2 update methods "put" the change position sends a request to the other updates handler
        // TODO:        The request is being sent with order: -1 and position: -1, the collectionsId being sent twice. and fix the API
        updatedCard.Embedding = await TryGetEmbeddingAsync(updatedCard);
        return await _collectionsService.UpdateCardAsync(id, updatedCard) ? Ok() : NotFound();
    }

    [HttpPost("search")]
    public async Task<IActionResult> SearchCards([FromBody] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest("The search query is null or empty.");
        }

        var results = await _collectionsService.SearchCardsAsync(query);

        var trimmedResults = results.Select(card => new Card
        {
            Id = card.Id,
            Key = card.Key,
            Value = card.Value,
        }).ToList();

        return Ok(trimmedResults);
    }

    private async Task<List<float>?> TryGetEmbeddingAsync(Card card)
    {
        try { return await _embeddingService.GetEmbeddingAsync(card.ToEmbeddingText()); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating embedding for card {CardId}", card.Id);
            return null;
        }
    }
}
