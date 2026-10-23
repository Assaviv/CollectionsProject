import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { Card } from '../types';
import Database from './database';
import { Collection } from './types';
import { CollectionsDB } from './collections-db';

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
  collection?: Collection;
  card?: Card;
  cards?: Card[];
  cardId?: string;
}

@Injectable({ providedIn: 'root' })
export class IndexedDBCollectionsDB implements Database<Collection> {
  private static readonly DATABASE_NAME = 'CollectionsUI';
  private static readonly DATABASE_VERSION = 2;
  private static readonly COLLECTIONS_STORE = 'collections';
  private static readonly OUTBOX_STORE = 'outbox';
  private static readonly POLL_INTERVAL_MS = 5 * 60 * 1000;

  private readonly collectionsSubject = new BehaviorSubject<Collection[]>([]);
  private readonly databasePromise = this.openDatabase();
  private readonly cache = new Map<string, Collection>();
  private started = false;
  private syncInProgress = false;
  private syncRequested = false;

  constructor(private remoteDatabase: CollectionsDB) {}

  retrieveCollections(): Observable<Collection[]> {
    this.startBackgroundSync();
    return this.collectionsSubject.asObservable();
  }

  async insert(collection: Collection): Promise<void> {
    const localCollection = { ...collection, cards: collection.cards ?? [] };
    const isDemoCollection = collection.id === 'demo';
    await this.writeCollection(localCollection, isDemoCollection ? undefined : {
      kind: 'insertCollection',
      collectionId: collection.id,
      collection: localCollection,
    });
    if (!isDemoCollection) void this.syncWithServer();
  }

  async deleteCollectionById(id: string): Promise<void> {
    await this.deleteLocalCollection(id, id === 'demo' ? undefined : {
      kind: 'deleteCollection',
      collectionId: id,
    });
    if (id !== 'demo') void this.syncWithServer();
  }

  async createCardByCollectionId(collectionId: string, card: Card): Promise<void> {
    await this.updateCollection(collectionId, (collection) => ({
      ...collection,
      cards: [...(collection.cards ?? []), card],
    }), collectionId === 'demo' ? undefined : {
      kind: 'createCard',
      collectionId,
      card,
    });
    if (collectionId !== 'demo') void this.syncWithServer();
  }

  async deleteCardFromCollection(collectionId: string, cardId: string): Promise<void> {
    await this.updateCollection(collectionId, (collection) => ({
      ...collection,
      cards: (collection.cards ?? []).filter((card) => card.id !== cardId),
    }), collectionId === 'demo' ? undefined : {
      kind: 'deleteCard',
      collectionId,
      cardId,
    });
    if (collectionId !== 'demo') void this.syncWithServer();
  }

  async updateCardFromCollection(collectionId: string, card: Card): Promise<void> {
    await this.updateCollection(collectionId, (collection) => ({
      ...collection,
      cards: (collection.cards ?? []).map((existing) =>
        existing.id === card.id ? card : existing,
      ),
    }), collectionId === 'demo' ? undefined : {
      kind: 'updateCard',
      collectionId,
      card,
    });
    if (collectionId !== 'demo') void this.syncWithServer();
  }

  async updateCardsOrder(
    collectionId: string,
    orderedCards: Card[],
    changedCards: Card[],
  ): Promise<void> {
    await this.updateCollection(
      collectionId,
      (collection) => ({ ...collection, cards: orderedCards }),
      collectionId === 'demo'
        ? undefined
        : {
            kind: 'reorderCards',
            collectionId,
            cards: changedCards,
          },
    );
    if (collectionId !== 'demo') void this.syncWithServer();
  }

  find(id: string): Collection | null {
    return this.cache.get(id) ?? null;
  }

  has(id: string): boolean {
    return this.cache.has(id);
  }

  syncNow(): void {
    this.startBackgroundSync();
    void this.syncWithServer();
  }

  private startBackgroundSync(): void {
    if (this.started) return;
    this.started = true;

    void this.loadLocalCollections().then(() => this.syncWithServer());
    window.setInterval(() => void this.syncWithServer(), IndexedDBCollectionsDB.POLL_INTERVAL_MS);
  }

  private async syncWithServer(): Promise<void> {
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
        for (const card of change.cards ?? []) {
          await this.remoteDatabase.updateCardFromCollection(
            change.collectionId,
            card,
          );
        }
    }
  }

  private async mergeRemoteCollections(remoteCollections: Collection[]): Promise<void> {
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

    let localCollections: Collection[] | undefined;
    let pendingChanges: QueuedChange[] | undefined;
    let merged: Collection[] = [];

    const mergeWhenReady = () => {
      if (!localCollections || !pendingChanges) return;

      const locallyChangedIds = new Set(
        pendingChanges.map((change) => change.collectionId),
      );
      const mergedById = new Map<string, Collection>();

      for (const collection of remoteCollections) {
        if (locallyChangedIds.has(collection.id)) continue;
        mergedById.set(collection.id, {
          ...collection,
          cards: collection.cards ?? [],
        });
      }

      for (const collection of localCollections) {
        if (collection.id === 'demo' || locallyChangedIds.has(collection.id)) {
          mergedById.set(collection.id, collection);
        }
      }

      merged = [...mergedById.values()];
      collectionStore.clear();
      merged.forEach((collection) => collectionStore.put(collection));
    };

    localRequest.onsuccess = () => {
      localCollections = localRequest.result as Collection[];
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
    const collections = await this.request<Collection[]>(
      transaction.objectStore(IndexedDBCollectionsDB.COLLECTIONS_STORE).getAll(),
    );
    await transactionDone;
    this.publish(collections);
  }

  private async writeCollection(
    collection: Collection,
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
    update: (collection: Collection) => Collection,
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
    const current = await this.request<Collection | undefined>(collectionStore.get(id));

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
    const collections = await this.request<Collection[]>(
      transaction.objectStore(IndexedDBCollectionsDB.COLLECTIONS_STORE).getAll(),
    );
    await transactionDone;
    this.publish(collections);
  }

  private publish(collections: Collection[]): void {
    this.cache.clear();
    collections.forEach((collection) => this.cache.set(collection.id, collection));
    this.collectionsSubject.next(collections);
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        IndexedDBCollectionsDB.DATABASE_NAME,
        IndexedDBCollectionsDB.DATABASE_VERSION,
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
