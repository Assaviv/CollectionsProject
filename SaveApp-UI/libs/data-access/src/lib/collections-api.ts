import { InjectionToken } from "@angular/core";
import { Card, DBCollection } from "@save-app/models";
import { Observable } from "rxjs";

export abstract class CollectionsApi {
  abstract readonly hasUnsyncedChanges$: Observable<boolean>;
  abstract retrieveCollections(): Observable<DBCollection[]>;
  abstract insert(collection: DBCollection): Promise<void>;
  abstract deleteCollectionById(id: string): Promise<void>;
  abstract createCardByCollectionId(collectionId: string, card: Card): Promise<void>;
  abstract deleteCardFromCollection(collectionId: string, cardId: string): Promise<void>;
  abstract updateCardFromCollection(collectionId: string, card: Card): Promise<void>;
  abstract updateCardsOrder(collectionId: string, ordered: Card[], changed: Card[]): Promise<void>;
  abstract syncNow(): Promise<void>;
  abstract cardSynced$(cardId: string): Observable<boolean>;
}

export const REMOTE_COLLECTIONS_API = new InjectionToken<CollectionsApi>('REMOTE_COLLECTIONS_API');
