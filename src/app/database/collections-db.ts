import { Injectable } from '@angular/core';
import Database from './database';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
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
    await firstValueFrom(this.http.post<void>(this.url + '/', collection));
  }

  async deleteCollectionById(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(this.url + '/' + id));
  }

  async createCardByCollectionId(id: string, newCard: Card): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(this.url + '/' + id + '/Cards', newCard),
    );
  }

  async deleteCardFromCollection(collectionId: string, cardId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(this.url + '/' + collectionId + '/Cards', {
        body: { cardId: cardId },
      }),
    );
  }

  async updateCardFromCollection(collectionId: string, cardToUpdate: Card): Promise<void> {
    await firstValueFrom(
      this.http.put<void>(this.url + '/' + collectionId + '/Cards', cardToUpdate),
    );
  }

  find(id: string): Observable<Collection> {
    return this.http.get<Collection>(this.url + '/id/' + id);
  }

  has(record: string): boolean {
    return false;
  }
}
