import { inject, Injectable } from '@angular/core';
import { distinctUntilChanged, map, Observable, shareReplay, switchMap } from 'rxjs';
import { Card, CardDraft, Collection, CollectionType, DBCollection } from '@save-app/models';
import { CollectionsApi } from './collections-api';

@Injectable({ providedIn: 'root' })
export class CollectionsFacade {
  private readonly api = inject(CollectionsApi);

  readonly collections$: Observable<DBCollection[]> = this.api
    .retrieveCollections()
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  readonly collectionList$: Observable<Collection[]> = this.collections$.pipe(
    map((all) => all.map(this.toCollection)),
    distinctUntilChanged(this.sameCollectionDetails),
  );

  cards$(collectionId: string): Observable<Card[]> {
    return this.collections$.pipe(
      map((all) => all.find((c) => c.id === collectionId)?.cards ?? []),
      distinctUntilChanged(),
    );
  }

  cardSynced$(cardId: string): Observable<boolean> {
    return this.api.cardSynced$(cardId);
  }

  readonly hasUnsyncedChanges$ = this.collections$.pipe(
    switchMap(() => this.api.hasUnsyncedChanges$),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  createCard(collectionId: string, draft: CardDraft): Promise<void> {
    const card: Card = { ...draft, id: crypto.randomUUID() };
    return this.api.createCardByCollectionId(collectionId, card);
  }

  updateCard(collectionId: string, card: Card): Promise<void> {
    return this.api.updateCardFromCollection(collectionId, card);
  }

  deleteCard(collectionId: string, cardId: string): Promise<void> {
    return this.api.deleteCardFromCollection(collectionId, cardId);
  }

  reorderCards(collectionId: string, cards: Card[], from: number, to: number): Promise<void> {
    const ordered = [...cards];
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);

    const withOrder = ordered.map((card, i) => ({ ...card, order: i }));
    const changed = withOrder.filter(
      (card) => card.order !== cards.find((c) => c.id === card.id)?.order,
    );
    return this.api.updateCardsOrder(collectionId, withOrder, changed);
  }

  async insertCollection(
    draft: Pick<Collection, 'title' | 'description' | 'emoji'>,
  ): Promise<string> {
    const id = crypto.randomUUID();
    await this.api.insert({
      id,
      title: draft.title,
      description: draft.description,
      emoji: draft.emoji,
      cards: [],
    });
    return id;
  }

  deleteCollection(id: string): Promise<void> {
    return this.api.deleteCollectionById(id);
  }

  syncNow(): Promise<void> {
    return this.api.syncNow();
  }

  toCollection(c: DBCollection): Collection {
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      emoji: c.emoji,
      collectionType: CollectionType.ANY,
    };
  }

  private sameCollectionDetails(a: Collection[], b: Collection[]): boolean {
    return (
      a.length === b.length &&
      a.every((x, i) =>
        x.id === b[i].id && x.title === b[i].title && x.description === b[i].description &&
        x.emoji === b[i].emoji && x.backgroundColor === b[i].backgroundColor)
    );
  }
}
