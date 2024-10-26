import { Injectable } from '@angular/core';
import Database from './database';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Collection } from './types';
import { Card } from '../types';

@Injectable({
  providedIn: 'root',
})
export class MongoDB implements Database<Collection> {
  private readonly url = 'http://localhost:5056/api/Collections';

  constructor(private http: HttpClient) {
    console.log();
  }

  getCollections(): Observable<Collection[]> {
    return this.http.get<Collection[]>(this.url);
  }

  async insert(collection: Collection): Promise<void> {
    if (collection.id === 'demo') {
      return;
    }

    this.http.post(this.url + '/', collection).subscribe();

    console.log('Request sent', JSON.stringify(collection));
  }

  async deleteCollectionById(id: string): Promise<void> {
    this.http.delete(this.url + '/' + id).subscribe();
  }

  find(id: string): Observable<Collection> {
    return this.http.get<Collection>(this.url + '/id/' + id);
  }

  has(record: string): boolean {
    return false;
  }

  async createCardByCollectionId(id: string, newCard: Card): Promise<void> {
    this.http.post(this.url + '/' + id + 'Cards', newCard).subscribe();
  }
}
