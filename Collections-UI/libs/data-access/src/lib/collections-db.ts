import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { Card, DBCollection } from '@save-app/models';
import { DATA_ACCESS_CONFIG } from './config';
import { CollectionsApi } from './collections-api';

@Injectable({
  providedIn: 'root',
})
export class CollectionsDB implements CollectionsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(DATA_ACCESS_CONFIG).apiBaseUrl.replace(/\/$/, '') + '/Collections';
  
  retrieveCollections(): Observable<DBCollection[]> {
    return this.http.get<DBCollection[]>(this.url());
  }

  async insert(collection: DBCollection): Promise<void> {
    await firstValueFrom(this.http.post<void>(this.url(), collection));
  }

  async deleteCollectionById(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(this.url(id)));
  }

  async createCardByCollectionId(id: string, newCard: Card): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(this.url(id, 'Cards'), newCard),
    );
  }

  async deleteCardFromCollection(collectionId: string, cardId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(this.url(collectionId, 'Cards'), {
        body: { cardId: cardId },
      }),
    );
  }

  async updateCardFromCollection(collectionId: string, cardToUpdate: Card): Promise<void> {
    await firstValueFrom(
      this.http.put<void>(this.url(collectionId, 'Cards'), cardToUpdate),
    );
  }

  async updateCardsOrder(collectionId: string, _orderedCards: Card[], changedCards: Card[]): Promise<void> {
    for (const card of changedCards) {
      await this.updateCardFromCollection(collectionId, card);
    } 
  }

  private url(...segments: string[]): string {
    return [this.baseUrl, ...segments.map(encodeURIComponent)].join('/');
  }
}
