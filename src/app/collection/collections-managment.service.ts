import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Collection, ManagmentService } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { IndexedDBCollectionsDB } from '../database/indexeddb-collections-db';

@Injectable({
  providedIn: 'root',
})
export class CollectionsManagmentService
  implements ManagmentService<Collection>
{
  subject!: BehaviorSubject<Collection[]>;
  selectedCollection = new BehaviorSubject<Collection | null>(null);
  previousSelectedCollection!: string | null;

  constructor(private database: IndexedDBCollectionsDB) {
    this.subject = new BehaviorSubject<Collection[]>([]);
  }

  addExistingItem(collection: Collection): void {
    this.subject.next([...this.currentItems, collection]);
  }

  addItem(subjectInput: Omit<Collection, 'id'>): void {
    const collection: Collection = {
      id: uuidv4(),
      ...subjectInput,
    };

    this.database.insert({
      ...collection,
      cards: [],
    });

    this.subject.next([...this.currentItems, collection]);
    this.changeSelection = collection;
  }

  deleteItem(id: string): void {
    const remainingCollections = this.currentItems.filter(
      (collection) => collection.id !== id,
    );

    if (this.previousSelectedCollection === id) { // Doesn't work
      this.selectedCollection.next(remainingCollections[0] ?? null);
    }

    this.database.deleteCollectionById(id);

    this.subject.next(remainingCollections);
  }

  set changeSelection(selectedCollection: Collection) {
    this.previousSelectedCollection = this.selectedCollection.getValue()?.id ?? null;
    this.selectedCollection.next(selectedCollection);
  }

  get items$(): Observable<Collection[]> {
    return this.subject.asObservable();
  }

  get currentItems(): Collection[] {
    return this.subject.getValue();
  }

  replaceExistingItems(collections: Collection[]): void {
    const currentItems = this.currentItems;
    const listChanged =
      currentItems.length !== collections.length ||
      collections.some(
        (collection, index) =>
          !currentItems[index] ||
          !this.hasSameCollectionDetails(currentItems[index], collection),
      );

    if (listChanged) {
      this.subject.next(collections);
    }

    const currentSelection = this.selectedCollection?.getValue();
    const selectedCollection = collections.find(
      (collection) => collection.id === currentSelection?.id,
    );
    if (!selectedCollection && collections.length) {
      this.changeSelection = collections[0];
    } else if (!collections.length && currentSelection) {
      this.selectedCollection.next(null);
    }
  }

  refreshFromServer(): void {
    this.database.syncNow();
  }

  private hasSameCollectionDetails(
    first: Collection,
    second: Collection | undefined,
  ): boolean {
    return Boolean(
      second &&
        first.id === second.id &&
        first.title === second.title &&
        first.description === second.description &&
        first.emoji === second.emoji &&
        first.collectionType === second.collectionType &&
        first.backgroundColor === second.backgroundColor,
    );
  }
}
