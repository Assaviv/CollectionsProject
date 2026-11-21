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
  /** Moves a card to `rank` in the target (same collection = reorder). Without a rank the local store picks one at the end; the server always receives one. */
  abstract moveCard(fromCollectionId: string, toCollectionId: string, cardId: string, rank?: string): Promise<void>;
  abstract syncNow(): Promise<void>;
  abstract cardSynced$(cardId: string): Observable<boolean>;
}

export const REMOTE_COLLECTIONS_API = new InjectionToken<CollectionsApi>('REMOTE_COLLECTIONS_API');
