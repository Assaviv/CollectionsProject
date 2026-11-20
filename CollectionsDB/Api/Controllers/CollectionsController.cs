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

    [HttpPost("inbox")]
    public async Task<IActionResult> Inbox([FromBody] InboxRequest data)
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

        await _collectionsService.CreateInboxCardAsync(newCard);

        return Ok();
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
    [HttpPost("{id:length(36)}/Cards/{cardId}/move")]
    public async Task<IActionResult> MoveCard([FromRoute] string id, [FromRoute] string cardId) =>
        await _collectionsService.MoveCardAsync(cardId, id) ? Ok() : NotFound();

    // Updates a card's content. Its position is kept; reordering goes through PUT …/Cards/order.
    [HttpPut("{id:length(36)}/Cards")]
    public async Task<IActionResult> UpdateCardInCollection([FromRoute] string id, [FromBody] CardRequest request) =>
        await _collectionsService.UpdateCardAsync(id, request.ToDomain()) ? Ok() : NotFound();

    // Body: { cardIds: [...] } in the new order. Idempotent, so outbox retries are safe.
    [HttpPut("{id:length(36)}/Cards/order")]
    public async Task<IActionResult> ReorderCards([FromRoute] string id, [FromBody] ReorderCardsRequest request) =>
        await _collectionsService.ReorderCardsAsync(id, request.CardIds ?? []) ? NoContent() : NotFound();

}
