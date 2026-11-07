import { TestBed } from '@angular/core/testing';
import { Card, CardDraft, CardType, CollectionType, DBCollection } from '@save-app/models';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { CollectionsApi } from './collections-api';
import { CollectionsFacade } from './collections-facade';

describe('CollectionsFacade', () => {
  let facade: CollectionsFacade;
  let collections: BehaviorSubject<DBCollection[]>;
  let api: jest.Mocked<CollectionsApi>;
  const first: Card = { id: 'a', key: 'A', cardType: CardType.SUBJECT, order: 0 };
  const second: Card = { id: 'b', key: 'B', cardType: CardType.SUBJECT, order: 1 };

  beforeEach(() => {
    collections = new BehaviorSubject<DBCollection[]>([
      { id: 'one', title: 'One', description: 'Description', emoji: '📚', cards: [first, second] },
    ]);
    api = {
      retrieveCollections: jest.fn(() => collections.asObservable()),
      insert: jest.fn().mockResolvedValue(undefined),
      deleteCollectionById: jest.fn().mockResolvedValue(undefined),
      createCardByCollectionId: jest.fn().mockResolvedValue(undefined),
      deleteCardFromCollection: jest.fn().mockResolvedValue(undefined),
      updateCardFromCollection: jest.fn().mockResolvedValue(undefined),
      updateCardsOrder: jest.fn().mockResolvedValue(undefined),
      syncNow: jest.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({ providers: [CollectionsFacade, { provide: CollectionsApi, useValue: api }] });
    facade = TestBed.inject(CollectionsFacade);
  });

  it('projects collections to the public collection model', async () => {
    await expect(firstValueFrom(facade.collectionList$)).resolves.toEqual([
      { id: 'one', title: 'One', description: 'Description', emoji: '📚', collectionType: CollectionType.ANY },
    ]);
  });

  it('emits cards for a requested collection and an empty array when absent', async () => {
    await expect(firstValueFrom(facade.cards$('one'))).resolves.toEqual([first, second]);
    await expect(firstValueFrom(facade.cards$('missing'))).resolves.toEqual([]);
  });

  it('creates a card with a generated id and delegates it', async () => {
  // Ensure crypto and randomUUID exist in the test environment before spying
    if (!global.crypto) {
      global.crypto = {} as any;
    }
    if (!global.crypto.randomUUID) {
      global.crypto.randomUUID = () => 'fallback-id-0-0-0';
    }

    const randomUUID = jest.spyOn(crypto, 'randomUUID').mockReturnValue('new-card-id-0-0');
    const draft: CardDraft = { key: 'New', value: 'Value', cardType: CardType.SUBJECT };

    await facade.createCard('one', draft);

    expect(api.createCardByCollectionId).toHaveBeenCalledWith('one', { ...draft, id: 'new-card-id-0-0' });
    randomUUID.mockRestore();
  });

  it('moves a card and sends only cards whose order changed', async () => {
    await facade.reorderCards('one', [first, second], 0, 1);

    expect(api.updateCardsOrder).toHaveBeenCalledWith('one',
      [{ ...second, order: 0 }, { ...first, order: 1 }],
      [{ ...second, order: 0 }, { ...first, order: 1 }],
    );
  });

  it('forwards card, collection and sync operations', async () => {
    const updated = { ...first, key: 'Updated' };
    await facade.updateCard('one', updated);
    await facade.deleteCard('one', first.id);
    await facade.deleteCollection('one');
    await facade.syncNow();

    expect(api.updateCardFromCollection).toHaveBeenCalledWith('one', updated);
    expect(api.deleteCardFromCollection).toHaveBeenCalledWith('one', first.id);
    expect(api.deleteCollectionById).toHaveBeenCalledWith('one');
    expect(api.syncNow).toHaveBeenCalled();
  });

  it('inserts collection drafts with an id and empty cards', async () => {
    // Ensure crypto and randomUUID exist in the test environment before spying
    if (!global.crypto) {
      global.crypto = {} as any;
    }
    if (!global.crypto.randomUUID) {
      global.crypto.randomUUID = () => 'fallback-id-0-0-0';
    }

    const randomUUID = jest.spyOn(crypto, 'randomUUID').mockReturnValue('new-collection-id-0-0');

    await expect(facade.insertCollection({ title: 'New', description: 'About', emoji: '✨' }))
      .resolves.toBe('new-collection-id-0-0');

    expect(api.insert).toHaveBeenCalledWith({
      id: 'new-collection-id-0-0', title: 'New', description: 'About', emoji: '✨', cards: [],
    });
    randomUUID.mockRestore();
  });
});
