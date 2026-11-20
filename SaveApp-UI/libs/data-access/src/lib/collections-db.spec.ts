import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Card, CardType, DBCollection } from '@save-app/models';
import { DATA_ACCESS_CONFIG } from './config';
import { CollectionsDB } from './collections-db';

describe('CollectionsDB', () => {
  let database: CollectionsDB;
  let http: HttpTestingController;
  const collection: DBCollection = { id: 'collection/1', title: 'Books', description: '', emoji: '📚', cards: [] };
  const card: Card = { id: 'card 1', key: 'Title', value: 'Dune', cardType: CardType.SUBJECT };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(),
        { provide: DATA_ACCESS_CONFIG, useValue: { apiBaseUrl: '/api/' } }],
    });
    database = TestBed.inject(CollectionsDB);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('retrieves collections from the collections endpoint', (done) => {
    database.retrieveCollections().subscribe((result) => {
      expect(result).toEqual([collection]);
      done();
    });
    http.expectOne('/api/Collections').flush([collection]);
  });

  it('inserts a collection', async () => {
    const result = database.insert(collection);
    http.expectOne({ method: 'POST', url: '/api/Collections' }).flush(null);
    await expect(result).resolves.toBeUndefined();
  });

  it('moves a card with the target collection move endpoint', async () => {
    const pending = database.moveCard('from', 'to', 'card-1');
    const request = http.expectOne({ method: 'POST', url: '/api/Collections/to/Cards/card-1/move' });
    expect(request.request.body).toEqual({ rank: null });
    request.flush(null);
    await expect(pending).resolves.toBeUndefined();
  });

  it('sends the rank when moving a card to a place (a reorder)', async () => {
    const pending = database.moveCard('to', 'to', 'card-1', 'a0V');
    const request = http.expectOne({ method: 'POST', url: '/api/Collections/to/Cards/card-1/move' });
    expect(request.request.body).toEqual({ rank: 'a0V' });
    request.flush(null);
    await expect(pending).resolves.toBeUndefined();
  });

  it('encodes collection ids when deleting collections', async () => {
    const result = database.deleteCollectionById(collection.id);
    http.expectOne({ method: 'DELETE', url: '/api/Collections/collection%2F1' }).flush(null);
    await expect(result).resolves.toBeUndefined();
  });

  it('creates, deletes and updates cards using the collection cards endpoint', async () => {
    const create = database.createCardByCollectionId(collection.id, card);
    http.expectOne({ method: 'POST', url: '/api/Collections/collection%2F1/Cards' }).flush(null);
    await expect(create).resolves.toBeUndefined();

    const remove = database.deleteCardFromCollection(collection.id, card.id);
    const deleteRequest = http.expectOne({ method: 'DELETE', url: '/api/Collections/collection%2F1/Cards' });
    expect(deleteRequest.request.body).toEqual({ cardId: card.id });
    deleteRequest.flush(null);
    await expect(remove).resolves.toBeUndefined();

    const update = database.updateCardFromCollection(collection.id, card);
    const updateRequest = http.expectOne({ method: 'PUT', url: '/api/Collections/collection%2F1/Cards' });
    expect(updateRequest.request.body).toEqual(card);
    updateRequest.flush(null);
    await expect(update).resolves.toBeUndefined();
  });

});
