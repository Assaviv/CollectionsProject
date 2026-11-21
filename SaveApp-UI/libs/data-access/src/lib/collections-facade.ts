import { inject, Injectable } from '@angular/core';
import { distinctUntilChanged, firstValueFrom, map, Observable, shareReplay, switchMap } from 'rxjs';
import { Card, CardDraft, Collection, CollectionType, DBCollection } from '@save-app/models';
import { CollectionsApi } from './collections-api';
import { isValidRank, rankBetween, ranksBetween } from './rank';

@Injectable({ providedIn: 'root' })
export class CollectionsFacade {
  private readonly api = inject(CollectionsApi);

  readonly collections$: Observable<DBCollection[]> = this.api
    .retrieveCollections()
    .pipe(
      map(pinInboxFirst),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

  readonly inbox$: Observable<DBCollection | null> = this.collections$.pipe(
    map((all) => all.find(isInbox) ?? null),
  );

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

  /** Moves a card to the end of another collection. It keeps its id, so the server keeps its embedding. */
  moveCard(fromCollectionId: string, toCollectionId: string, cardId: string): Promise<void> {
    if (fromCollectionId === toCollectionId) return Promise.resolve();
    return this.api.moveCard(fromCollectionId, toCollectionId, cardId);
  }

  /**
   * Moves `cards[from]` to index `to`. Only that card changes: it gets a rank between its new neighbours
   * and is sent as a move within the same collection.
   */
  async reorderCards(collectionId: string, cards: Card[], from: number, to: number): Promise<void> {
    if (from === to) return;
    const ordered = [...cards];
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);

    const before = ordered[to - 1];
    const after = ordered[to + 1];
    if (canRankBetween(before, after)) {
      return this.api.moveCard(collectionId, collectionId, moved.id, rankBetween(before?.rank ?? null, after?.rank ?? null));
    }

    // Neighbours tie (two devices appended at once) or have no valid rank: re-rank the whole list,
    // sending a move only for the cards whose rank actually changes.
    const ranks = ranksBetween(null, null, ordered.length);
    for (const [i, card] of ordered.entries()) {
      if (card.rank !== ranks[i]) await this.api.moveCard(collectionId, collectionId, card.id, ranks[i]);
    }
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

  /** The inbox can't be deleted; asking to is a no-op. */
  async deleteCollection(id: string): Promise<void> {
    const all = await firstValueFrom(this.collections$);
    if (all.some((c) => c.id === id && isInbox(c))) return;
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
      ...(c.kind ? { kind: c.kind } : {}),
    };
  }

  private sameCollectionDetails(a: Collection[], b: Collection[]): boolean {
    return (
      a.length === b.length &&
      a.every((x, i) =>
        x.id === b[i].id && x.title === b[i].title && x.description === b[i].description &&
        x.emoji === b[i].emoji && x.backgroundColor === b[i].backgroundColor && x.kind === b[i].kind)
    );
  }
}

function isInbox(c: Pick<DBCollection, 'kind'>): boolean {
  return c.kind === 'INBOX';
}

/** Keeps the inbox pinned at the top; the rest stay in their original order. */
function pinInboxFirst(all: DBCollection[]): DBCollection[] {
  const inbox = all.find(isInbox);
  return inbox ? [inbox, ...all.filter((c) => c !== inbox)] : all;
}

/** True when a rank strictly between the two neighbours exists (a missing neighbour = open end). */
function canRankBetween(before: Card | undefined, after: Card | undefined): boolean {
  if (before && !isValidRank(before.rank)) return false;
  if (after && !isValidRank(after.rank)) return false;
  return !before || !after || before.rank! < after.rank!;
}
