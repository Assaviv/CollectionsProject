import { DestroyRef, inject, Injectable } from '@angular/core';
import { BehaviorSubject, filter, firstValueFrom, fromEvent, map, merge, Observable, timer } from 'rxjs';
import { Card, DBCollection } from '@save-app/models';
import { CollectionsApi, REMOTE_COLLECTIONS_API } from './collections-api';
import { SYNC_CONFIG } from './config';
import { DATA_ACCESS_CONFIG } from './config';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type ChangeKind =
  | 'insertCollection'
  | 'deleteCollection'
  | 'createCard'
  | 'deleteCard'
  | 'updateCard'
  | 'reorderCards';

interface QueuedChange {
  sequence?: number;
  kind: ChangeKind;
  collectionId: string;
  collection?: DBCollection;
  card?: Card;
  cards?: Card[];
  cardId?: string;
}

@Injectable({ providedIn: 'root' })
export class IndexedDBCollectionsDB implements CollectionsApi {
  private static readonly COLLECTIONS_STORE = 'collections';
  private static readonly OUTBOX_STORE = 'outbox';

  private readonly sync = inject(SYNC_CONFIG);
  private readonly dataAccess = inject(DATA_ACCESS_CONFIG);
  private readonly remoteDatabase = inject(REMOTE_COLLECTIONS_API);

  private readonly collectionsSubject = new BehaviorSubject<DBCollection[]>([]);
  private readonly syncedCardIds = new BehaviorSubject<Set<string>>(this.loadSyncedCardIds());
  private readonly databasePromise = this.openDatabase();
  private readonly cache = new Map<string, DBCollection>();

  private readonly destroyRef = inject(DestroyRef);
  private started = false;
  private syncInProgress = false;
  private syncRequested = false;

  retrieveCollections(): Observable<DBCollection[]> {
    this.startBackgroundSync();
    return this.collectionsSubject.asObservable();
  }

  cardSynced$(cardId: string): Observable<boolean> {
    return this.syncedCardIds.pipe(map((ids) => ids.has(cardId)));
  }

  async insert(collection: DBCollection): Promise<void> {
    const localCollection = { ...collection, cards: collection.cards ?? [] };
    await this.writeCollection(localCollection, {
      kind: 'insertCollection',
      collectionId: collection.id,
      collection: localCollection,
    });
    this.markUnsynced(localCollection.cards.map((card) => card.id));
    
    void this.syncWithServer();
  }

  async deleteCollectionById(id: string): Promise<void> {
    await this.deleteLocalCollection(id, {
      kind: 'deleteCollection',
      collectionId: id,
    });
    
    void this.syncWithServer();
  }

  async createCardByCollectionId(collectionId: string, card: Card): Promise<void> {
    await this.updateCollection(collectionId, (collection) => ({
      ...collection,
      cards: [...(collection.cards ?? []), card],
    }), {
      kind: 'createCard',
      collectionId,
      card,
    });
    this.markUnsynced([card.id]);
    
    void this.syncWithServer();
  }

  async deleteCardFromCollection(collectionId: string, cardId: string): Promise<void> {
    await this.updateCollection(collectionId, (collection) => ({
      ...collection,
      cards: (collection.cards ?? []).filter((card) => card.id !== cardId),
    }), {
      kind: 'deleteCard',
      collectionId,
      cardId,
    });
    this.markUnsynced([cardId]);
    
    void this.syncWithServer();
  }

  async updateCardFromCollection(collectionId: string, card: Card): Promise<void> {
    await this.updateCollection(collectionId, (collection) => ({
      ...collection,
      cards: (collection.cards ?? []).map((existing) =>
        existing.id === card.id ? card : existing,
      ),
    }), {
      kind: 'updateCard',
      collectionId,
      card,
    });
    this.markUnsynced([card.id]);
    
    void this.syncWithServer();
  }

  async updateCardsOrder(
    collectionId: string,
    orderedCards: Card[],
    changedCards: Card[],
  ): Promise<void> {
    await this.updateCollection(
      collectionId,
      (collection) => ({ ...collection, cards: orderedCards }),
      {
          kind: 'reorderCards',
          collectionId,
          cards: changedCards,
      },
    );
    this.markUnsynced(changedCards.map((card) => card.id));
    
    void this.syncWithServer();
  }

  find(id: string): DBCollection | null {
    return this.cache.get(id) ?? null;
  }

  has(id: string): boolean {
    return this.cache.has(id);
  }

  syncNow(): Promise<void> {
    this.startBackgroundSync();
    return this.syncWithServer();
  }

  private startBackgroundSync(): void {
    if (this.started) return;
    this.started = true;
    void this.loadLocalCollections().then(() => this.syncWithServer());

    merge(
      timer(this.sync.pollIntervalMs, this.sync.pollIntervalMs),
      fromEvent(window, 'online'),
      fromEvent(document, 'visibilitychange').pipe(
        filter(() => document.visibilityState === 'visible'),
      ),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.syncWithServer());
  }

  private async syncWithServer(): Promise<void> {
    if (this.dataAccess.canSync && !this.dataAccess.canSync()) {
      return;
    }
    if (this.syncInProgress) {
      this.syncRequested = true;
      return;
    }
    this.syncInProgress = true;

    try {
      await this.uploadPendingChanges();
      const remoteCollections = await firstValueFrom(
        this.remoteDatabase.retrieveCollections(),
      );
      await this.mergeRemoteCollections(remoteCollections);
      const db = await this.databasePromise;
      const transaction = db.transaction(IndexedDBCollectionsDB.OUTBOX_STORE, 'readonly');
      const done = this.transactionComplete(transaction);
      const pending = await this.request<QueuedChange[]>(transaction.objectStore(IndexedDBCollectionsDB.OUTBOX_STORE).getAll());
      await done;
      const remoteIds = new Set(remoteCollections.flatMap((collection) => (collection.cards ?? []).map((card) => card.id)));
      for (const change of pending) {
        if (change.kind === 'insertCollection') {
          for (const card of change.collection?.cards ?? []) remoteIds.delete(card.id);
        } else if (change.card) {
          remoteIds.delete(change.card.id);
        } else if (change.cardId) {
          remoteIds.delete(change.cardId);
        } else if (change.cards) {
          for (const card of change.cards) remoteIds.delete(card.id);
        }
      }
      this.setSyncedCardIds(remoteIds);
    } catch {
      // Keep local data available while the server is unreachable.
    } finally {
      this.syncInProgress = false;
      if (this.syncRequested) {
        this.syncRequested = false;
        void this.syncWithServer();
      }
    }
  }

  private async uploadPendingChanges(): Promise<void> {
    const db = await this.databasePromise;
    const transaction = db.transaction(
      IndexedDBCollectionsDB.OUTBOX_STORE,
      'readonly',
    );
    const transactionDone = this.transactionComplete(transaction);
    const changes = await this.request<QueuedChange[]>(
      transaction.objectStore(IndexedDBCollectionsDB.OUTBOX_STORE).getAll(),
    );
    await transactionDone;

    for (const change of changes) {
      try {
        await this.sendChange(change);
      } catch {
        // Preserve this and later changes for the next retry.
        break;
      }

      const deleteTransaction = db.transaction(
        IndexedDBCollectionsDB.OUTBOX_STORE,
        'readwrite',
      );
      const deleteDone = this.transactionComplete(deleteTransaction);
      deleteTransaction.objectStore(IndexedDBCollectionsDB.OUTBOX_STORE)
        .delete(change.sequence!);
      await deleteDone;
    }
  }

  private async sendChange(change: QueuedChange): Promise<void> {
    switch (change.kind) {
      case 'insertCollection':
        await this.remoteDatabase.insert(change.collection!);
        return;
      case 'deleteCollection':
        await this.remoteDatabase.deleteCollectionById(change.collectionId);
        return;
      case 'createCard':
        await this.remoteDatabase.createCardByCollectionId(
          change.collectionId,
          change.card!,
        );
        return;
      case 'deleteCard':
        await this.remoteDatabase.deleteCardFromCollection(
          change.collectionId,
          change.cardId!,
        );
        return;
      case 'updateCard':
        await this.remoteDatabase.updateCardFromCollection(
          change.collectionId,
          change.card!,
        );
        return;
      case 'reorderCards':
        await this.remoteDatabase.updateCardsOrder(
          change.collectionId,
          change.cards ?? [],
          change.cards ?? [],
        );
    }
  }

  private async mergeRemoteCollections(remoteCollections: DBCollection[]): Promise<void> {
    const db = await this.databasePromise;
    const transaction = db.transaction(
      [IndexedDBCollectionsDB.COLLECTIONS_STORE, IndexedDBCollectionsDB.OUTBOX_STORE],
      'readwrite',
    );
    const transactionDone = this.transactionComplete(transaction);
    const collectionStore = transaction.objectStore(
      IndexedDBCollectionsDB.COLLECTIONS_STORE,
    );
    const localRequest = collectionStore.getAll();
    const outboxRequest = transaction
      .objectStore(IndexedDBCollectionsDB.OUTBOX_STORE)
      .getAll();

    let localCollections: DBCollection[] | undefined;
    let pendingChanges: QueuedChange[] | undefined;
    let merged: DBCollection[] = [];

    const mergeWhenReady = () => {
      if (!localCollections || !pendingChanges) return;

      const locallyChangedIds = new Set(
        pendingChanges.map((change) => change.collectionId),
      );
      const mergedById = new Map<string, DBCollection>();

      for (const collection of remoteCollections) {
        if (locallyChangedIds.has(collection.id)) continue;
        mergedById.set(collection.id, {
          ...collection,
          cards: collection.cards ?? [],
        });
      }

      for (const collection of localCollections) {
        if (locallyChangedIds.has(collection.id)) {
          mergedById.set(collection.id, collection);
        }
      }

      merged = [...mergedById.values()];
      collectionStore.clear();
      merged.forEach((collection) => collectionStore.put(collection));
    };

    localRequest.onsuccess = () => {
      localCollections = localRequest.result as DBCollection[];
      mergeWhenReady();
    };
    outboxRequest.onsuccess = () => {
      pendingChanges = outboxRequest.result as QueuedChange[];
      mergeWhenReady();
    };

    await transactionDone;
    this.publish(merged);
  }

  private async loadLocalCollections(): Promise<void> {
    const db = await this.databasePromise;
    const transaction = db.transaction(
      IndexedDBCollectionsDB.COLLECTIONS_STORE,
      'readonly',
    );
    const transactionDone = this.transactionComplete(transaction);
    const collections = await this.request<DBCollection[]>(
      transaction.objectStore(IndexedDBCollectionsDB.COLLECTIONS_STORE).getAll(),
    );
    await transactionDone;
    this.publish(collections);
  }

  private async writeCollection(
    collection: DBCollection,
    change?: Omit<QueuedChange, 'sequence'>,
  ): Promise<void> {
    const db = await this.databasePromise;
    const storeNames = change
      ? [IndexedDBCollectionsDB.COLLECTIONS_STORE, IndexedDBCollectionsDB.OUTBOX_STORE]
      : [IndexedDBCollectionsDB.COLLECTIONS_STORE];
    const transaction = db.transaction(storeNames, 'readwrite');
    const transactionDone = this.transactionComplete(transaction);
    transaction.objectStore(IndexedDBCollectionsDB.COLLECTIONS_STORE).put(collection);
    if (change) transaction.objectStore(IndexedDBCollectionsDB.OUTBOX_STORE).add(change);
    await transactionDone;
    await this.publishFromDatabase();
  }

  private async deleteLocalCollection(
    id: string,
    change?: Omit<QueuedChange, 'sequence'>,
  ): Promise<void> {
    const db = await this.databasePromise;
    const storeNames = change
      ? [IndexedDBCollectionsDB.COLLECTIONS_STORE, IndexedDBCollectionsDB.OUTBOX_STORE]
      : [IndexedDBCollectionsDB.COLLECTIONS_STORE];
    const transaction = db.transaction(storeNames, 'readwrite');
    const transactionDone = this.transactionComplete(transaction);
    transaction.objectStore(IndexedDBCollectionsDB.COLLECTIONS_STORE).delete(id);
    if (change) transaction.objectStore(IndexedDBCollectionsDB.OUTBOX_STORE).add(change);
    await transactionDone;
    await this.publishFromDatabase();
  }

  private async updateCollection(
    id: string,
    update: (collection: DBCollection) => DBCollection,
    change?: Omit<QueuedChange, 'sequence'>,
  ): Promise<void> {
    const db = await this.databasePromise;
    const stores = change
      ? [IndexedDBCollectionsDB.COLLECTIONS_STORE, IndexedDBCollectionsDB.OUTBOX_STORE]
      : [IndexedDBCollectionsDB.COLLECTIONS_STORE];
    const transaction = db.transaction(
      stores,
      'readwrite',
    );
    const transactionDone = this.transactionComplete(transaction);
    const collectionStore = transaction.objectStore(IndexedDBCollectionsDB.COLLECTIONS_STORE);
    const current = await this.request<DBCollection | undefined>(collectionStore.get(id));

    if (current) {
      collectionStore.put(update(current));
      if (change) {
        transaction.objectStore(IndexedDBCollectionsDB.OUTBOX_STORE).add(change);
      }
    }
    await transactionDone;
    await this.publishFromDatabase();
  }

  private async publishFromDatabase(): Promise<void> {
    const db = await this.databasePromise;
    const transaction = db.transaction(
      IndexedDBCollectionsDB.COLLECTIONS_STORE,
      'readonly',
    );
    const transactionDone = this.transactionComplete(transaction);
    const collections = await this.request<DBCollection[]>(
      transaction.objectStore(IndexedDBCollectionsDB.COLLECTIONS_STORE).getAll(),
    );
    await transactionDone;
    this.publish(collections);
  }

  private publish(collections: DBCollection[]): void {
    this.cache.clear();
    collections.forEach((collection) => this.cache.set(collection.id, collection));
    this.collectionsSubject.next(collections);
  }

  private markUnsynced(cardIds: string[]): void {
    if (cardIds.length === 0) return;
    const synced = new Set(this.syncedCardIds.value);
    cardIds.forEach((id) => synced.delete(id));
    this.setSyncedCardIds(synced);
  }

  private setSyncedCardIds(cardIds: Set<string>): void {
    this.syncedCardIds.next(cardIds);
    try {
      localStorage.setItem(
        `${this.sync.dbName}:synced-card-ids`,
        JSON.stringify([...cardIds]),
      );
    } catch {
      // Sync state remains available for the current session.
    }
  }

  private loadSyncedCardIds(): Set<string> {
    try {
      const stored = localStorage.getItem(`${this.sync.dbName}:synced-card-ids`);
      const ids: unknown = stored ? JSON.parse(stored) : [];
      return new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []);
    } catch {
      return new Set();
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        this.sync.dbName,
        this.sync.dbVersion,
      );
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IndexedDBCollectionsDB.COLLECTIONS_STORE)) {
          db.createObjectStore(IndexedDBCollectionsDB.COLLECTIONS_STORE, {
            keyPath: 'id',
          });
        }
        if (!db.objectStoreNames.contains(IndexedDBCollectionsDB.OUTBOX_STORE)) {
          db.createObjectStore(IndexedDBCollectionsDB.OUTBOX_STORE, {
            keyPath: 'sequence',
            autoIncrement: true,
          });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => db.close();
        resolve(db);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private request<T>(request: IDBRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  }

  private transactionComplete(transaction: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }
}
