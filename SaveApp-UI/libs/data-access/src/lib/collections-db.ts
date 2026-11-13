import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, map, Observable, of } from 'rxjs';
import { Card, DBCollection } from '@save-app/models';
import { DATA_ACCESS_CONFIG } from './config';
import { CollectionsApi } from './collections-api';

@Injectable({
  providedIn: 'root',
})
export class CollectionsDB implements CollectionsApi {
  readonly hasUnsyncedChanges$ = of(false);
  private readonly syncedCardIds = new BehaviorSubject<Set<string>>(new Set());
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(DATA_ACCESS_CONFIG).apiBaseUrl.replace(/\/$/, '') + '/Collections';
  
  retrieveCollections(): Observable<DBCollection[]> {
    return this.http.get<DBCollection[]>(this.url()).pipe(map((collections) => {
      this.syncedCardIds.next(new Set(collections.flatMap((collection) => collection.cards ?? []).map((card) => card.id)));
      return collections;
    }));
  }

  cardSynced$(cardId: string): Observable<boolean> {
    return this.syncedCardIds.pipe(map((ids) => ids.has(cardId)));
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
    this.markSynced(newCard.id);
  }

  async deleteCardFromCollection(collectionId: string, cardId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(this.url(collectionId, 'Cards'), {
        body: { cardId: cardId },
      }),
    );
    this.markUnsynced(cardId);
  }

  async updateCardFromCollection(collectionId: string, cardToUpdate: Card): Promise<void> {
    await firstValueFrom(
      this.http.put<void>(this.url(collectionId, 'Cards'), cardToUpdate),
    );
    this.markSynced(cardToUpdate.id);
  }

  async updateCardsOrder(collectionId: string, _orderedCards: Card[], changedCards: Card[]): Promise<void> {
    for (const card of changedCards) {
      await this.updateCardFromCollection(collectionId, card);
    } 
  }

  async syncNow(): Promise<void> {}

  private markSynced(cardId: string): void {
    const ids = new Set(this.syncedCardIds.value);
    ids.add(cardId);
    this.syncedCardIds.next(ids);
  }

  private markUnsynced(cardId: string): void {
    const ids = new Set(this.syncedCardIds.value);
    ids.delete(cardId);
    this.syncedCardIds.next(ids);
  }

  private url(...segments: string[]): string {
    return [this.baseUrl, ...segments.map(encodeURIComponent)].join('/');
  }
}
