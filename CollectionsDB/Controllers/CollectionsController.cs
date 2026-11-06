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
    private static readonly string INBOX_COLLECTION_ID = "inbox0000000000000000000000000000000";
    private readonly CollectionsApiInterface _collectionsService;
    private readonly EmbeddingService _embeddingService;

    public CollectionsController(CollectionsApiInterface collectionsService, EmbeddingService embeddingService)
    {
        _collectionsService = collectionsService;
        _embeddingService = embeddingService;
    }

    [HttpGet]
    public async Task<List<Collection>> Get() =>
        _collectionsService.GetCollections();

    [HttpGet("{id:length(36)}")]
    public async Task<ActionResult<Collection>> Get(string id)
    {
        var collection = _collectionsService.GetCollection(id);

        if (collection is null)
        {
            return NotFound();
        }

        return collection;
    }

    [HttpPost]
    public async Task<IActionResult> Post(Collection newCollection) // maybe create?
    {
        _collectionsService.CreateCollection(newCollection);

        return CreatedAtAction(nameof(Get), new { id = newCollection.Id }, newCollection);
    }

    [HttpPost("inbox")]
    public async Task<IActionResult> inbox([FromBody] InboxDto data)
    {

        Card newCard = new Card()
        {
            CardType = data.type == "link" ? CardType.LINK : CardType.SUBJECT,
            Key = data.key ?? data.text.ToString(),
        };

        if (newCard.CardType.Equals(CardType.LINK))
        {
            newCard.Value = data.text;
        }

        var inbox = _collectionsService.GetCollection(INBOX_COLLECTION_ID);

        if (inbox is null)
        {
            _collectionsService.CreateCollection(new Collection(){Id = INBOX_COLLECTION_ID, Cards=[], Description="This is the collection that is used store all of the shared cards", Title="inbox"});
        }

        newCard.Embedding = await TryGetEmbeddingAsync(newCard);
        _collectionsService.CreateCard(INBOX_COLLECTION_ID, newCard);

        return Ok();
    }

    [HttpPut("{id:length(36)}")]
    public async Task<IActionResult> Update(string id, Collection updatedcollection)
    {
        var collection = _collectionsService.GetCollection(id);

        if (collection is null)
        {
            return NotFound();
        }

        updatedcollection.Id = collection.Id;

        _collectionsService.UpdateCollection(id, updatedcollection);

        return NoContent();
    }

    [HttpDelete("{id:length(36)}")]
    public async Task<IActionResult> Delete(string id)
    {
        var collection = _collectionsService.GetCollection(id);

        if (collection is null)
        {
            return NotFound();
        }

        _collectionsService.RemoveCollection(id);

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
        _collectionsService.CreateCard(id, newCard);

        return CreatedAtAction(nameof(Get), new { id }, newCard);
    }

    public record DeleteRequest(string cardId);

    [HttpDelete("{id:length(36)}/Cards")]
    public IActionResult DeleteCardFromCollection([FromRoute] string id, [FromBody] DeleteRequest cardId)
    {
        _collectionsService.DeleteCard(id, cardId.cardId);
        return Ok();
    }

    [HttpPut("{id:length(36)}/Cards")]
    public async Task<IActionResult> UpdateCardInCollection([FromRoute] string id, [FromBody] Card updatedCard)
    { 
        // TODO: There are 2 update methods "put" the change position sends a request to the other updates handler
        // TODO:        The request is being sent with order: -1 and position: -1, the collectionsId being sent twice. and fix the API
        updatedCard.Embedding = await TryGetEmbeddingAsync(updatedCard);
        return _collectionsService.UpdateCard(id, updatedCard) ? Ok() : NotFound();
    }

    [HttpPost("search")]
    public IActionResult SearchCards([FromBody] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest("The search query is null or empty.");
        }

        var results = _collectionsService.SearchCards(query);

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
            Console.WriteLine("Error generating embedding: " + ex.Message);
            return null;
        }
    }
}
