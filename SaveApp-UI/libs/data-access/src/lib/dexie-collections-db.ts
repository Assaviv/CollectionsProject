import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Injectable, InjectionToken } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Dexie, { DexieOptions, liveQuery, Table } from 'dexie';
import { debounce, distinctUntilChanged, EMPTY, filter, firstValueFrom, from, fromEvent, map, merge, Observable, shareReplay, startWith, timeout, timer } from 'rxjs';
import { Card, DBCollection } from '@save-app/models';
import { CollectionsApi, REMOTE_COLLECTIONS_API } from './collections-api';
import { DATA_ACCESS_CONFIG, SYNC_CONFIG } from './config';
import { isValidRank, rankBetween, withRanks } from './rank';
import { describeError, SYNC_REQUEST_TIMEOUT_MS } from './sync-utils';

type ChangeKind = 'insertCollection' | 'deleteCollection' | 'createCard' | 'deleteCard' | 'updateCard' | 'moveCard';

/** One operation the server hasn't accepted yet. */
interface QueuedChange {
  sequence?: number;
  kind: ChangeKind;
  /** For moveCard this is the target collection. */
  collectionId: string;
  /** moveCard only: the collection the card left. */
  fromCollectionId?: string;
  collection?: DBCollection;
  card?: Card;
  cardId?: string;
  /** moveCard only: the card's rank in the target. A move within one collection is a reorder. */
  rank?: string;
}

type CollectionRow = Omit<DBCollection, 'cards'> & { position: number };
/** `rank` is copied out of `card` so `[collectionId+rank]` can index it; `collectionId` never leaks into the `Card`. */
interface CardRow { id: string; collectionId: string; rank: string; card: Card }
/** The IndexedDB globals Dexie runs on. */
export type IndexedDbImpl = Required<Pick<DexieOptions, 'indexedDB' | 'IDBKeyRange'>>;

const toCollectionRow = ({ cards: _cards, ...collection }: DBCollection, position: number): CollectionRow => ({ ...collection, position });
const toCardRow = (collectionId: string, card: Card & { rank: string }): CardRow => ({ id: card.id, collectionId, rank: card.rank, card });
const toCardRows = (collectionId: string, cards: Card[] = []): CardRow[] =>
  withRanks(cards).map((card) => toCardRow(collectionId, card as Card & { rank: string }));

export class CollectionsDexie extends Dexie {
  collections!: Table<CollectionRow, string>;
  cards!: Table<CardRow, string>;
  outbox!: Table<QueuedChange, number>;

  constructor(name: string, options: IndexedDbImpl) {
    super(name, options);
    this.version(1).stores({
      collections: 'id, position',
      cards: 'id, collectionId, [collectionId+rank]',
      outbox: '++sequence',
    });
  }
}

/** The IndexedDB implementation Dexie runs on. Swap it for e.g. fake-indexeddb in tests. */
export const INDEXED_DB = new InjectionToken<IndexedDbImpl>('INDEXED_DB', {
  providedIn: 'root',
  factory: () => ({ indexedDB: globalThis.indexedDB, IDBKeyRange: globalThis.IDBKeyRange }),
});

export const COLLECTIONS_DEXIE = new InjectionToken<CollectionsDexie>('COLLECTIONS_DEXIE', {
  providedIn: 'root',
  factory: () => new CollectionsDexie(inject(SYNC_CONFIG).dbName, inject(INDEXED_DB)),
});

/** Every emission starts a background sync. The default polls and listens for `online` and the page becoming visible. */
export const SYNC_TRIGGERS = new InjectionToken<Observable<unknown>>('SYNC_TRIGGERS', {
  providedIn: 'root',
  factory: () => {
    const { pollIntervalMs, syncOnOnline, syncOnVisible } = inject(SYNC_CONFIG);
    const document = inject(DOCUMENT);
    return merge(
      pollIntervalMs > 0 ? timer(pollIntervalMs, pollIntervalMs) : EMPTY,
      syncOnOnline && document.defaultView ? fromEvent(document.defaultView, 'online') : EMPTY,
      syncOnVisible
        ? fromEvent(document, 'visibilitychange').pipe(filter(() => document.visibilityState === 'visible'))
        : EMPTY,
    );
  },
});

@Injectable({ providedIn: 'root' })
export class DexieCollectionsDB implements CollectionsApi {
  private readonly db = inject(COLLECTIONS_DEXIE);
  private readonly remote = inject(REMOTE_COLLECTIONS_API);
  private readonly dataAccess = inject(DATA_ACCESS_CONFIG);
  private readonly sync = inject(SYNC_CONFIG);
  private readonly triggers = inject(SYNC_TRIGGERS);
  private readonly destroyRef = inject(DestroyRef);

  private started = false;
  private syncInProgress = false;
  private syncRequested = false;

  private readonly outbox$ = from(liveQuery(() => this.db.outbox.toArray())).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  private readonly collections$ = from(liveQuery(() => this.readCollections())).pipe(
    startWith([] as DBCollection[]),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly hasUnsyncedChanges$ = this.outbox$.pipe(
    map((changes) => changes.length > 0),
    distinctUntilChanged(),
    debounce((pending) => timer(pending ? this.sync.unsyncedDebounceMs : 0)),
    distinctUntilChanged(),
  );

  retrieveCollections(): Observable<DBCollection[]> {
    this.startBackgroundSync();
    return this.collections$;
  }

  cardSynced$(cardId: string): Observable<boolean> {
    // Same delay as hasUnsyncedChanges$: "unsynced" only shows if the change is still queued after it.
    return this.outbox$.pipe(
      map((changes) => !changes.some((c) => keepsCardUnsynced(c, cardId))),
      distinctUntilChanged(),
      debounce((synced) => timer(synced ? 0 : this.sync.unsyncedDebounceMs)),
      distinctUntilChanged(),
    );
  }

  insert(collection: DBCollection): Promise<void> {
    const local = { ...collection, cards: withRanks(collection.cards ?? []) };
    return this.mutate({ kind: 'insertCollection', collectionId: local.id, collection: local }, async () => {
      await this.db.collections.put(toCollectionRow(local, await this.nextCollectionPosition()));
      await this.db.cards.bulkPut(toCardRows(local.id, local.cards));
    });
  }

  deleteCollectionById(id: string): Promise<void> {
    return this.mutate({ kind: 'deleteCollection', collectionId: id }, async () => {
      await this.db.collections.delete(id);
      await this.db.cards.where('collectionId').equals(id).delete();
    });
  }

  createCardByCollectionId(collectionId: string, card: Card): Promise<void> {
    const change: QueuedChange = { kind: 'createCard', collectionId, card };
    return this.mutate(change, async () => {
      if (!(await this.exists(collectionId))) return false;
      const rank = isValidRank(card.rank) ? card.rank : rankBetween(await this.lastRank(collectionId), null);
      change.card = { ...card, rank }; // queued with the rank, so the server stores the same order
      await this.db.cards.put(toCardRow(collectionId, { ...card, rank }));
      return true;
    });
  }

  deleteCardFromCollection(collectionId: string, cardId: string): Promise<void> {
    return this.mutate({ kind: 'deleteCard', collectionId, cardId }, async () => {
      if (!(await this.exists(collectionId))) return false;
      if ((await this.db.cards.get(cardId))?.collectionId === collectionId) await this.db.cards.delete(cardId);
      return true;
    });
  }

  updateCardFromCollection(collectionId: string, card: Card): Promise<void> {
    return this.mutate({ kind: 'updateCard', collectionId, card }, async () => {
      if (!(await this.exists(collectionId))) return false;
      const row = await this.db.cards.get(card.id);
      // Content only: the rank stays (it changes through moveCard).
      if (row?.collectionId === collectionId) await this.db.cards.put({ ...row, card: { ...card, rank: row.rank } });
      return true;
    });
  }

  moveCard(fromCollectionId: string, toCollectionId: string, cardId: string, rank?: string): Promise<void> {
    const change: QueuedChange = { kind: 'moveCard', collectionId: toCollectionId, fromCollectionId, cardId };
    return this.mutate(change, async () => {
      const row = await this.db.cards.get(cardId);
      if (row?.collectionId !== fromCollectionId || !(await this.exists(toCollectionId))) return false;
      if (fromCollectionId === toCollectionId && !isValidRank(rank)) return false;
      change.rank = isValidRank(rank) ? rank : rankBetween(await this.lastRank(toCollectionId), null);
      await this.db.cards.put(toCardRow(toCollectionId, { ...row.card, rank: change.rank }));
      return true;
    });
  }

  syncNow(): Promise<void> {
    this.startBackgroundSync();
    return this.syncWithServer();
  }

  /**
   * Applies a local change and queues it in the outbox in one transaction. `apply` returning false skips
   * queueing; `apply` may fill in `change` (e.g. the rank it picked) before it is queued.
   */
  private async mutate(change: QueuedChange, apply: () => Promise<boolean | void>): Promise<void> {
    const { collections, cards, outbox } = this.db;
    await this.db.transaction('rw', collections, cards, outbox, async () => {
      if ((await apply()) !== false) await outbox.add(change);
    });
    void this.syncWithServer();
  }

  private async readCollections(): Promise<DBCollection[]> {
    const { collections, cards } = this.db;
    const [collectionRows, cardRows] = await this.db.transaction('r', collections, cards, () =>
      // Index order is (collectionId, rank), then the primary key (id) on ties: the same as the server.
      Promise.all([collections.orderBy('position').toArray(), cards.orderBy('[collectionId+rank]').toArray()]),
    );
    const cardsByCollection = new Map<string, Card[]>();
    for (const { collectionId, card } of cardRows) {
      const list = cardsByCollection.get(collectionId);
      if (list) list.push(card);
      else cardsByCollection.set(collectionId, [card]);
    }
    return collectionRows.map(({ position: _position, ...c }) => ({ ...c, cards: cardsByCollection.get(c.id) ?? [] }));
  }

  private async exists(collectionId: string): Promise<boolean> {
    return (await this.db.collections.get(collectionId)) !== undefined;
  }

  private async nextCollectionPosition(): Promise<number> {
    return ((await this.db.collections.orderBy('position').last())?.position ?? -1) + 1;
  }

  private async lastRank(collectionId: string): Promise<string | null> {
    const last = await this.db.cards
      .where('[collectionId+rank]')
      .between([collectionId, Dexie.minKey], [collectionId, Dexie.maxKey])
      .last();
    return last?.rank ?? null;
  }

  private startBackgroundSync(): void {
    if (this.started) return;
    this.started = true;
    void this.syncWithServer();
    this.triggers.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => void this.syncWithServer());
  }

  /** One sync at a time; a request made while one runs triggers exactly one more pass afterwards. */
  private async syncWithServer(): Promise<void> {
    if (this.dataAccess.canSync && !this.dataAccess.canSync()) return;
    if (this.syncInProgress) {
      this.syncRequested = true;
      return;
    }
    this.syncInProgress = true;
    try {
      await this.uploadPendingChanges();
      await this.mergeRemoteCollections(
        await firstValueFrom(this.remote.retrieveCollections().pipe(timeout(SYNC_REQUEST_TIMEOUT_MS))),
      );
    } catch (e) {
      // Keep local data available while the server is unreachable.
      console.warn('[sync] pass failed; will retry on the next trigger', describeError(e));
    } finally {
      this.syncInProgress = false;
      if (this.syncRequested) {
        this.syncRequested = false;
        void this.syncWithServer();
      }
    }
  }

  /** Replays the outbox in order and stops at the first failure, keeping it and everything after it for the next try. */
  private async uploadPendingChanges(): Promise<void> {
    for (const change of await this.db.outbox.toArray()) {
      try {
        await firstValueFrom(from(this.send(change)).pipe(timeout(SYNC_REQUEST_TIMEOUT_MS)));
      } catch (e) {
        console.warn(`[sync] ${change.kind} #${change.sequence} failed; it and later changes stay queued`, describeError(e));
        return;
      }
      await this.db.outbox.delete(change.sequence!);
    }
  }

  private send(change: QueuedChange): Promise<void> {
    const { collectionId: id } = change;
    switch (change.kind) {
      case 'insertCollection': return this.remote.insert(change.collection!);
      case 'deleteCollection': return this.remote.deleteCollectionById(id);
      case 'createCard': return this.remote.createCardByCollectionId(id, change.card!);
      case 'deleteCard': return this.remote.deleteCardFromCollection(id, change.cardId!);
      case 'updateCard': return this.remote.updateCardFromCollection(id, change.card!);
      case 'moveCard': return this.remote.moveCard(change.fromCollectionId!, id, change.cardId!, change.rank);
    }
  }

  /** The server wins, except for collections that still have queued changes: those keep their local state. */
  private async mergeRemoteCollections(remote: DBCollection[]): Promise<void> {
    const { collections, cards, outbox } = this.db;
    await this.db.transaction('rw', collections, cards, outbox, async () => {
      const locked = new Set(
        (await outbox.toArray()).flatMap((c) => (c.fromCollectionId ? [c.collectionId, c.fromCollectionId] : [c.collectionId])),
      );
      const stale = (await collections.toCollection().primaryKeys()).filter((id) => !locked.has(id));
      await collections.bulkDelete(stale);
      await cards.where('collectionId').anyOf(stale).delete();

      const incoming = remote.map((c, position) => ({ c, position })).filter(({ c }) => !locked.has(c.id));
      await collections.bulkPut(incoming.map(({ c, position }) => toCollectionRow(c, position)));
      await cards.bulkPut(incoming.flatMap(({ c }) => toCardRows(c.id, c.cards)));
    });
  }
}

/**
 * Sync indicator only (used by `cardSynced$`): does this queued change still have to reach the server
 * before the card on screen matches it? Not a general "does this change touch the card" check.
 * `deleteCollection` is false because its cards are already removed locally, so none is left to mark.
 * No `default`: a new `ChangeKind` fails to compile until it's handled here.
 */
function keepsCardUnsynced(change: QueuedChange, cardId: string): boolean {
  switch (change.kind) {
    case 'insertCollection': return (change.collection?.cards ?? []).some((card) => card.id === cardId);
    case 'createCard':
    case 'updateCard': return change.card?.id === cardId;
    case 'deleteCard':
    case 'moveCard': return change.cardId === cardId;
    case 'deleteCollection': return false;
  }
}
