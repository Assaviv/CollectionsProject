using CollectionsDB.Application.Collections;
using CollectionsDB.Domain.Cards;
using CollectionsDB.Domain.Collections;
using Microsoft.AspNetCore.Mvc;
using CollectionsDB.Api.Contracts.Collections;
using CollectionsDB.Api.Contracts.Cards;
using CollectionsDB.Api.Mapping;
using CollectionsDB.Api.Contracts.Search;

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

        await _collectionsService.CreateInboxCardAsync(INBOX_COLLECTION_ID, newCard);

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

    [HttpPut("{id:length(36)}/Cards")]
    public async Task<IActionResult> UpdateCardInCollection([FromRoute] string id, [FromBody] CardRequest request)
    { 
        // TODO: There are 2 update methods "put" the change position sends a request to the other updates handler
        // TODO:        The request is being sent with order: -1 and position: -1, the collectionsId being sent twice. and fix the API
        return await _collectionsService.UpdateCardAsync(id, request.ToDomain()) ? Ok() : NotFound();
    }

    [HttpPost("search")]
    public async Task<IActionResult> SearchCards([FromBody] SearchCardsRequest request)
    {
        var query = request.Query;
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest("The search query is null or empty.");
        }

        var results = await _collectionsService.SearchCardsAsync(query);
        var answer = await _collectionsService.AnswerAsync(query, results);
        System.Console.WriteLine(answer);

        var trimmedResults = results.Select(card => new CardResponse(
            card.Id,
            CollectionId: "", // will change in the embedding service refactor
            card.Key,
            card.Value,
            CardTypeContract.SUBJECT,
            IsFavorite: false,
            IsArchived: false,
            Position: -1)).ToList();

        return Ok(new  { answer, results = trimmedResults});
    }

}
