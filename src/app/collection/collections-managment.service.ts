import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Collection, ManagmentService } from '../types';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class CollectionsManagmentService
  implements ManagmentService<Collection>
{
  subject!: BehaviorSubject<Collection[]>;
  selectedCollection!: BehaviorSubject<Collection>;

  constructor() {
    this.subject = new BehaviorSubject<Collection[]>([]);
  }

  addItem(subjectInput: Omit<Collection, 'id'>): void {
    this.subject.next([
      {
        id: uuidv4(),
        ...subjectInput,
      },
      ...this.currentItems,
    ]);
  }

  deleteItem(id: string): void {
    this.selectionAfterDelete(
      this.currentItems.filter((collection) => collection.id === id)[0]
    );

    this.subject.next(
      this.currentItems.filter((collection) => collection.id !== id)
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
        'This is not handled edge case which is being protected by the defualt collection which is yet to be ready'
      );
    }
    // TODO: handle it better, and also check the following case:
    //*       When not selected collection get deleted the selected collection gots reload
  }

  set changeSelection(selectedCollection: Collection) {
    if (!this.selectedCollection) {
      this.selectedCollection = new BehaviorSubject<Collection>(
        selectedCollection
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
}
