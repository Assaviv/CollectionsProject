import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Injectable, InjectionToken } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Dexie, { DexieOptions, liveQuery, Table } from 'dexie';
import { debounce, distinctUntilChanged, EMPTY, filter, firstValueFrom, from, fromEvent, map, merge, Observable, shareReplay, startWith, timer } from 'rxjs';
import { Card, DBCollection } from '@save-app/models';
import { CollectionsApi, REMOTE_COLLECTIONS_API } from './collections-api';
import { DATA_ACCESS_CONFIG, SYNC_CONFIG } from './config';

type ChangeKind = 'insertCollection' | 'deleteCollection' | 'createCard' | 'deleteCard' | 'updateCard' | 'reorderCards' | 'moveCard';

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
  cards?: Card[];
  cardId?: string;
}

type CollectionRow = Omit<DBCollection, 'cards'> & { position: number };
/** The card is nested so `collectionId`/`position` never leak into the `Card` the UI sees or the server receives. */
interface CardRow { id: string; collectionId: string; position: number; card: Card }
/** The IndexedDB globals Dexie runs on. */
export type IndexedDbImpl = Required<Pick<DexieOptions, 'indexedDB' | 'IDBKeyRange'>>;

/**
 * Upper bound for one server call during sync. A request that never settles (e.g. the app was frozen
 * in the background mid-request) would otherwise keep `syncInProgress` true forever, and every later
 * change would sit in the outbox until the app restarts.
 */
export const SYNC_REQUEST_TIMEOUT_MS = 30_000;

/** Short, loggable description; HttpErrorResponse carries status/url, other errors just a message. */
function describeError(e: unknown): string {
  const err = e as { status?: number; url?: string; message?: string };
  return err?.status !== undefined ? `HTTP ${err.status} ${err.url ?? ''}`.trim() : String(err?.message ?? e);
}

function withTimeout<T>(promise: Promise<T>, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${what} timed out after ${SYNC_REQUEST_TIMEOUT_MS} ms`)), SYNC_REQUEST_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const toCollectionRow =({ cards: _cards, ...collection }: DBCollection, position: number): CollectionRow => ({ ...collection, position });
const toCardRows = (collectionId: string, cards: Card[] = []): CardRow[] =>
  cards.map((card, position) => ({ id: card.id, collectionId, position, card }));

export class CollectionsDexie extends Dexie {
  collections!: Table<CollectionRow, string>;
  cards!: Table<CardRow, string>;
  outbox!: Table<QueuedChange, number>;

  constructor(name: string, options: IndexedDbImpl) {
    super(name, options);
    this.version(1).stores({
      collections: 'id, position',
      cards: 'id, collectionId, [collectionId+position]',
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
    return this.outbox$.pipe(map((changes) => !changes.some((c) => keepsCardUnsynced(c, cardId))), distinctUntilChanged());
  }

  insert(collection: DBCollection): Promise<void> {
    const local = { ...collection, cards: collection.cards ?? [] };
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
    return this.mutate({ kind: 'createCard', collectionId, card }, async () => {
      if (!(await this.exists(collectionId))) return false;
      await this.db.cards.put({ id: card.id, collectionId, position: await this.nextCardPosition(collectionId), card });
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
      if (row?.collectionId === collectionId) await this.db.cards.put({ ...row, card });
      return true;
    });
  }

  moveCard(fromCollectionId: string, toCollectionId: string, cardId: string): Promise<void> {
    return this.mutate({ kind: 'moveCard', collectionId: toCollectionId, fromCollectionId, cardId }, async () => {
      const row = await this.db.cards.get(cardId);
      if (row?.collectionId !== fromCollectionId || !(await this.exists(toCollectionId))) return false;
      await this.db.cards.put({ ...row, collectionId: toCollectionId, position: await this.nextCardPosition(toCollectionId) });
      return true;
    });
  }

  updateCardsOrder(collectionId: string, orderedCards: Card[], changedCards: Card[]): Promise<void> {
    return this.mutate({ kind: 'reorderCards', collectionId, cards: changedCards }, async () => {
      if (!(await this.exists(collectionId))) return false;
      await this.db.cards.where('collectionId').equals(collectionId).delete();
      await this.db.cards.bulkPut(toCardRows(collectionId, orderedCards));
      return true;
    });
  }

  syncNow(): Promise<void> {
    this.startBackgroundSync();
    return this.syncWithServer();
  }

  /** Applies a local change and queues it in the outbox in one transaction. `apply` returning false skips queueing. */
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
      Promise.all([collections.orderBy('position').toArray(), cards.orderBy('[collectionId+position]').toArray()]),
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

  private async nextCardPosition(collectionId: string): Promise<number> {
    const last = await this.db.cards
      .where('[collectionId+position]')
      .between([collectionId, Dexie.minKey], [collectionId, Dexie.maxKey])
      .last();
    return (last?.position ?? -1) + 1;
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
        await withTimeout(firstValueFrom(this.remote.retrieveCollections()), 'retrieveCollections'),
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
        await withTimeout(this.send(change), change.kind);
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
      case 'moveCard': return this.remote.moveCard(change.fromCollectionId!, id, change.cardId!);
      case 'reorderCards': return this.remote.updateCardsOrder(id, change.cards ?? [], change.cards ?? []);
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
    case 'reorderCards': return (change.cards ?? []).some((card) => card.id === cardId);
    case 'deleteCollection': return false;
  }
}
