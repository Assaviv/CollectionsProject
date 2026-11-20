import { TestBed } from '@angular/core/testing';
import { Card, CardDraft, CardType, CollectionType, DBCollection } from '@save-app/models';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { CollectionsApi } from './collections-api';
import { CollectionsFacade } from './collections-facade';

describe('CollectionsFacade', () => {
  let facade: CollectionsFacade;
  let collections: BehaviorSubject<DBCollection[]>;
  let api: jest.Mocked<CollectionsApi>;
  const first: Card = { id: 'a', key: 'A', cardType: CardType.SUBJECT, rank: 'a0' };
  const second: Card = { id: 'b', key: 'B', cardType: CardType.SUBJECT, rank: 'a1' };

  beforeEach(() => {
    collections = new BehaviorSubject<DBCollection[]>([
      { id: 'one', title: 'One', description: 'Description', emoji: '📚', cards: [first, second] },
    ]);
    api = {
      hasUnsyncedChanges$: of(false),
      cardSynced$: jest.fn((_cardId: string) => of(true)),
      retrieveCollections: jest.fn(() => collections.asObservable()),
      insert: jest.fn().mockResolvedValue(undefined),
      deleteCollectionById: jest.fn().mockResolvedValue(undefined),
      createCardByCollectionId: jest.fn().mockResolvedValue(undefined),
      deleteCardFromCollection: jest.fn().mockResolvedValue(undefined),
      updateCardFromCollection: jest.fn().mockResolvedValue(undefined),
      moveCard: jest.fn().mockResolvedValue(undefined),
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

  it('reorders by moving only the dragged card to a rank between its new neighbours', async () => {
    const third: Card = { id: 'c', key: 'C', cardType: CardType.SUBJECT, rank: 'a2' };
    await facade.reorderCards('one', [first, second, third], 0, 1);

    expect(api.moveCard).toHaveBeenCalledTimes(1);
    expect(api.moveCard).toHaveBeenCalledWith('one', 'one', first.id, 'a1V');
  });

  it('ranks a card dragged to either end against the open side', async () => {
    const third: Card = { id: 'c', key: 'C', cardType: CardType.SUBJECT, rank: 'a2' };
    await facade.reorderCards('one', [first, second, third], 2, 0);
    await facade.reorderCards('one', [first, second, third], 0, 2);

    expect(api.moveCard).toHaveBeenNthCalledWith(1, 'one', 'one', third.id, 'Zz');
    expect(api.moveCard).toHaveBeenNthCalledWith(2, 'one', 'one', first.id, 'a3');
  });

  it('re-ranks the list when the new neighbours tie or have no rank', async () => {
    const tied: Card = { ...second, id: 'b2' };            // same rank as `second`: two devices appended at once
    await facade.reorderCards('one', [first, second, tied], 0, 1);

    // New order: second, first, tied → ranks a0, a1, a2. Only cards whose rank changes are sent.
    expect(api.moveCard).toHaveBeenCalledWith('one', 'one', second.id, 'a0');
    expect(api.moveCard).toHaveBeenCalledWith('one', 'one', first.id, 'a1');
    expect(api.moveCard).toHaveBeenCalledWith('one', 'one', tied.id, 'a2');

    jest.mocked(api.moveCard).mockClear();
    // `first` lands next to a card without a rank: re-rank. `first` keeps a0, only `unranked` is sent.
    const unranked: Card = { id: 'u', key: 'U', cardType: CardType.SUBJECT };
    await facade.reorderCards('one', [unranked, first], 1, 0);
    expect(api.moveCard).toHaveBeenCalledTimes(1);
    expect(api.moveCard).toHaveBeenCalledWith('one', 'one', unranked.id, 'a1');
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
  it('pins the inbox first and exposes it', async () => {
    const inbox: DBCollection = { id: 'inbox', title: 'Inbox', description: '', emoji: '📥', cards: [], kind: 'INBOX' };
    collections.next([collections.value[0], inbox]);

    const list = await firstValueFrom(facade.collectionList$);
    expect(list.map((c) => c.id)).toEqual(['inbox', 'one']);
    expect(list[0].kind).toBe('INBOX');
    await expect(firstValueFrom(facade.inbox$)).resolves.toEqual(inbox);
  });

  it('never deletes the inbox', async () => {
    collections.next([{ id: 'inbox', title: 'Inbox', description: '', emoji: '📥', cards: [], kind: 'INBOX' }]);

    await facade.deleteCollection('inbox');

    expect(api.deleteCollectionById).not.toHaveBeenCalled();
  });

  it('moves a card between collections and ignores moves to the same collection', async () => {
    await facade.moveCard('one', 'two', first.id);
    await facade.moveCard('one', 'one', first.id);

    expect(api.moveCard).toHaveBeenCalledTimes(1);
    expect(api.moveCard).toHaveBeenCalledWith('one', 'two', first.id);
  });
});
