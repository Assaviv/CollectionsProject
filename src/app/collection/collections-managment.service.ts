import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Collection,
  CollectionType,
  DEFUALT_COLLECTION,
  ManagmentService,
} from '../types';
import { v4 as uuidv4 } from 'uuid';
import { CardsManagmentService } from '../cards/cards-managment.service';
import { CollectionComponent } from './collection.component';

@Injectable({
  providedIn: 'root',
})
export class CollectionsManagmentService
  implements ManagmentService<Collection>
{
  subject!: BehaviorSubject<Collection[]>;
  selectedCollection!: BehaviorSubject<Collection>;

  constructor() {
    this.subject = new BehaviorSubject<Collection[]>([DEFUALT_COLLECTION]);
    this.selectedCollection = new BehaviorSubject<Collection>(
      DEFUALT_COLLECTION
    );
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
    this.selectedCollection.next(selectedCollection);
  }

  get items$(): Observable<Collection[]> {
    return this.subject.asObservable();
  }
  get currentItems(): Collection[] {
    return this.subject.getValue();
  }
}
