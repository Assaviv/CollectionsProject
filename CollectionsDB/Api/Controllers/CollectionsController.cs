using CollectionsDB.Application.Collections;
using CollectionsDB.Domain.Cards;
using CollectionsDB.Domain.Collections;
using Microsoft.AspNetCore.Mvc;
using CollectionsDB.Api.Contracts.Collections;
using CollectionsDB.Api.Contracts.Cards;
using CollectionsDB.Api.Mapping;

namespace CollectionsDB.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CollectionsController : ControllerBase
{
    private readonly ICollectionsService _collectionsService;

    public CollectionsController(ICollectionsService collectionsService)
    {
        _collectionsService = collectionsService;
    }

    [HttpGet]
    public async Task<ActionResult<List<CollectionResponse>>> Get()
    {
        var collections = await _collectionsService.GetCollectionsAsync();
        return Ok(collections.Select(CollectionMapper.ToResponse).ToList());
    }

    [HttpGet("{id:length(36)}")]
    public async Task<ActionResult<CollectionResponse>> Get(string id)
    {
        var collection = await _collectionsService.GetCollectionAsync(id);

        if (collection is null)
        {
            return NotFound();
        }

        return collection.ToResponse();
    }

    [HttpPost]
    public async Task<IActionResult> Post(CreateCollectionRequest request)
    {
        var newCollection = request.ToDomain();

        await _collectionsService.CreateCollectionAsync(newCollection);

        return CreatedAtAction(nameof(Get), new { id = newCollection.Id }, newCollection.ToResponse());
    }

    [HttpPut("{id:length(36)}")]
    public async Task<IActionResult> Update(string id, UpdateCollectionRequest request)
    {
        var collection = await _collectionsService.GetCollectionAsync(id);

        if (collection is null)
        {
            return NotFound();
        }

        var updatedCollection = request.ToDomain();
        updatedCollection.Id = collection.Id;

        await _collectionsService.UpdateCollectionAsync(id, updatedCollection);

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

        // The inbox can't be deleted. Answer 204 anyway: the client's offline outbox retries
        // failed requests forever, and its next sync brings the inbox back.
        await _collectionsService.RemoveCollectionAsync(id);

        return NoContent();
    }

    [HttpPost("{id:length(36)}/Cards")]
    public async Task<IActionResult> InsertCardIntoCollection(string id, CardRequest request)
    {
        if (request is null)
        {
            return BadRequest("The card was not inserted, card is null");
        }

        var newCard = request.ToDomain();
        await _collectionsService.CreateCardAsync(id, newCard);

        return CreatedAtAction(nameof(Get), new { id }, newCard.ToResponse());
    }

    [HttpDelete("{id:length(36)}/Cards")]
    public async Task<IActionResult> DeleteCardFromCollection([FromRoute] string id, [FromBody] DeleteCardRequest cardId)
    {
        await _collectionsService.DeleteCardAsync(id, cardId.cardId);
        return Ok();
    }

    // {id} is the target collection. The card keeps its id (and its embedding).
    // Moves a card to collection {id} at the rank the client picked. A move within the same collection
    // is a reorder. Idempotent (same target + rank), so outbox retries are safe.
    [HttpPost("{id:length(36)}/Cards/{cardId}/move")]
    public async Task<IActionResult> MoveCard([FromRoute] string id, [FromRoute] string cardId, [FromBody] MoveCardRequest request) =>
        await _collectionsService.MoveCardAsync(cardId, id, request.Rank) ? Ok() : NotFound();

    // Updates a card's content. Its rank is kept; reordering goes through …/move.
    [HttpPut("{id:length(36)}/Cards")]
    public async Task<IActionResult> UpdateCardInCollection([FromRoute] string id, [FromBody] CardRequest request) =>
        await _collectionsService.UpdateCardAsync(id, request.ToDomain()) ? Ok() : NotFound();

}
