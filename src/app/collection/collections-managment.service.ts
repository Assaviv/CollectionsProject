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
    this.subject.next(
      this.currentItems.filter((collection) => collection.id !== id)
    );
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
