import { Injectable } from '@angular/core';
import Database from './database';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Collection } from './types';
import { Card } from '../types';

@Injectable({
  providedIn: 'root',
})
export class CollectionsDB implements Database<Collection> {
  private readonly url = 'http://localhost:5056/api/Collections';
  /*
   Todo:
    Get url from environment variable or smth more fixed, like proxy.conf Handle db operation like, delete card, update card, change card position, etc 
    Add string formatting
  */

  constructor(private http: HttpClient) {}

  retrieveCollections(): Observable<Collection[]> {
    return this.http.get<Collection[]>(this.url);
  }

  async insert(collection: Collection): Promise<void> {
    if (collection.id === 'demo') {
      return;
    }

    this.http.post(this.url + '/', collection).subscribe();
  }

  async deleteCollectionById(id: string): Promise<void> {
    this.http.delete(this.url + '/' + id).subscribe();
  }

  async createCardByCollectionId(id: string, newCard: Card): Promise<void> {
    this.http.post(this.url + '/' + id + '/Cards', newCard).subscribe();
  }

  async deleteCardFromCollection(collectionId: string, cardId: string): Promise<void> {
    this.http.delete(this.url + '/' + collectionId + '/Cards', {
      body: { cardId: cardId },
    }).subscribe();
  }

  async updateCardFromCollection(collectionId: string, cardToUpdate: Card): Promise<void> {
    this.http.put(this.url + '/' + collectionId + '/Cards', cardToUpdate).subscribe();
  }

  find(id: string): Observable<Collection> {
    return this.http.get<Collection>(this.url + '/id/' + id);
  }

  has(record: string): boolean {
    return false;
  }
}
