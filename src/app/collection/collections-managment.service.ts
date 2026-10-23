import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Collection, ManagmentService } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { CollectionsDB } from '../database/collections-db';

@Injectable({
  providedIn: 'root',
})
export class CollectionsManagmentService
  implements ManagmentService<Collection>
{
  subject!: BehaviorSubject<Collection[]>;
  selectedCollection!: BehaviorSubject<Collection>;

  constructor(private database: CollectionsDB) {
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
  }

  deleteItem(id: string): void {
    this.selectionAfterDelete(
      this.currentItems.filter((collection) => collection.id === id)[0],
    );

    this.database.deleteCollectionById(id);

    this.subject.next(
      this.currentItems.filter((collection) => collection.id !== id),
    );
  }

  selectionAfterDelete(collection?: Collection) {
    // handle null above
    const currentCollection = this.selectedCollection.getValue();
    const substitueCollection = this.currentItems[this.currentItems.length - 1];
    const edgeCollectionToSubstitute =
      this.currentItems[this.currentItems.length - 2];

    if (
      currentCollection.id === collection?.id &&
      collection?.id !== substitueCollection.id
    ) {
      this.changeSelection = substitueCollection;
    } else if (currentCollection.id === substitueCollection.id) {
      this.changeSelection = edgeCollectionToSubstitute;
    } else {
      throw new Error(
        'This is not handled edge case which is being protected by the defualt collection which is yet to be ready',
      );
    }
    // TODO: handle it better, and also check the following case:
    //*       When not selected collection get deleted the selected collection gots reload
  }

  set changeSelection(selectedCollection: Collection) {
    if (!this.selectedCollection) {
      this.selectedCollection = new BehaviorSubject<Collection>(
        selectedCollection,
      );
      return;
    }

    this.selectedCollection.next(selectedCollection);
  }

  get items$(): Observable<Collection[]> {
    return this.subject.asObservable();
  }

  get currentItems(): Collection[] {
    return this.subject.getValue();
  }

  refreshFromServer(): void {
    // TODO: implement after local database is finished
  //   this.database.retrieveCollections().subscribe((collections) => {
  //     this.subject.next(collections);

  //     const selectedId = this.selectedCollection?.getValue()?.id;
  //     const refreshedSelection = collections.find(
  //       (collection) => collection.id === selectedId,
  //     );
  //     if (refreshedSelection) {
  //       this.changeSelection = refreshedSelection;
  //     }
  //   });
  }
}
