using System.Runtime.CompilerServices;
using CollectionsService.Models;
using CollectionsService.Services;
using Microsoft.AspNetCore.Mvc;

namespace CollectionsService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CollectionsController : ControllerBase
{
    private readonly CollectionsApiInterface _collectionsService;

    public CollectionsController(CollectionsApiInterface collectionsService) =>
        _collectionsService = collectionsService;

    [HttpGet]
    public async Task<List<Collection>> Get() =>
        _collectionsService.GetAsync();

    [HttpGet("{id:length(36)}")]
    public async Task<ActionResult<Collection>> Get(string id)
    {
        var collection = _collectionsService.GetAsync(id);

        if (collection is null)
        {
            return NotFound();
        }

        return collection;
    }

    [HttpPost]
    public async Task<IActionResult> Post(Collection newCollection) // maybe create?
    {
        _collectionsService.CreateAsync(newCollection);

        return CreatedAtAction(nameof(Get), new { id = newCollection.Id }, newCollection);
    }

    [HttpPut("{id:length(36)}")]
    public async Task<IActionResult> Update(string id, Collection updatedcollection)
    {
        var collection = _collectionsService.GetAsync(id);

        if (collection is null)
        {
            return NotFound();
        }

        updatedcollection.Id = collection.Id;

        _collectionsService.UpdateAsync(id, updatedcollection);

        return NoContent();
    }

    [HttpDelete("{id:length(36)}")]
    public async Task<IActionResult> Delete(string id)
    {
        var collection = _collectionsService.GetAsync(id);

        if (collection is null)
        {
            return NotFound();
        }

        _collectionsService.RemoveAsync(id);

        return NoContent();
    }

    [HttpPost("{id:length(36)}/Cards")]
    public IActionResult InsertCardIntoCollection(string id, Card newCard)
    {
        Console.WriteLine("Inserting card");
        _collectionsService.CreateCard(id, newCard);

        return CreatedAtAction(nameof(Get), new { id = newCard.Id }, newCard);
    }

    public record DeleteRequest(string cardId);

    [HttpDelete("{id:length(36)}/Cards")]
    public IActionResult DeleteCardFromCollection([FromRoute] string id, [FromBody] DeleteRequest cardId)
    {
        _collectionsService.DeleteCard(id, cardId.cardId); // cardID is null

        return Ok();
    }

    [HttpPut("{id:length(36)}/Cards")]
    public IActionResult UpdateCardInCollection([FromRoute] string id, [FromBody] Card updatedCard)
    { 
        if (updatedCard is null)
        {
            return BadRequest("The card was not updated, card is null");
        }

        _collectionsService.DeleteCard(id, updatedCard.Id ?? ""); 
        _collectionsService.CreateCard(id, updatedCard);

        return Ok();
    }
}
