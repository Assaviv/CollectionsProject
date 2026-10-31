import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Card } from '@save-app/models';
import { v4 as uuidv4 } from 'uuid';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { COLLECTION_ID } from './cards-managment-factory.service';
import { IndexedDBCollectionsDB } from '../database/indexeddb-collections-db';

@Injectable({
  providedIn: 'root',
})
export class CardsManagmentService {
  private cardsBehaviorSubject!: BehaviorSubject<Card[]>;

  constructor(
    @Inject(COLLECTION_ID) private collectionId: string,
    private database: IndexedDBCollectionsDB,
  ) {
    this.cardsBehaviorSubject = new BehaviorSubject<Card[]>([]);
  }

  public createExistingCard(card: Card): void {
    this.cardsBehaviorSubject.next([card, ...this.currentCards]);
  }

  public replaceExistingCards(cards: Card[]): void {
    if (this.haveSameCards(this.currentCards, cards)) return;

    this.cardsBehaviorSubject.next(cards);
  }

  public createCard(card: Omit<Card, 'id'>): void {
    const newCard: Card = {
      id: uuidv4(),
      order: this.currentCards.length,
      ...card,
    };

    this.database.createCardByCollectionId(this.collectionId, newCard);

    this.createExistingCard(newCard);
  }

  // TODO: donot update where there is no change
  // TODO: Create patch card for partial updates
  public updateCard(cardToUpdate: Card): void {
    this.database.updateCardFromCollection(this.collectionId, cardToUpdate);

    const updatedCards = this.currentCards.map((card) => {
      return card.id === cardToUpdate.id ? cardToUpdate : card;
    });

    this.cardsBehaviorSubject.next(updatedCards);
  }

  public deleteCard(id: string): void {
    this.database.deleteCardFromCollection(this.collectionId, id);

    this.cardsBehaviorSubject.next(
      this.currentCards.filter((card) => card.id !== id),
    );
  }

  public changeCardsOrder(previousIndex: number, currentIndex: number): void {
    if (
      previousIndex === currentIndex ||
      previousIndex < 0 ||
      currentIndex < 0 ||
      previousIndex >= this.currentCards.length ||
      currentIndex >= this.currentCards.length
    ) {
      return;
    }

    const reorderedCards = [...this.currentCards];
    moveItemInArray(reorderedCards, previousIndex, currentIndex);
    const cardsWithUniqueOrder = reorderedCards.map((card, order) => ({
      ...card,
      order,
    }));
    const currentOrderById = new Map(
      this.currentCards.map((card) => [card.id, card.order]),
    );
    const changedCards = cardsWithUniqueOrder.filter(
      (card) => currentOrderById.get(card.id) !== card.order,
    );

    this.cardsBehaviorSubject.next(cardsWithUniqueOrder);
    void this.database.updateCardsOrder(
      this.collectionId,
      cardsWithUniqueOrder,
      changedCards,
    );
  }

  public get cards$(): Observable<Card[]> {
    return this.cardsBehaviorSubject.asObservable();
  }

  private get currentCards(): Card[] {
    return this.cardsBehaviorSubject.getValue();
  }

  // TODO: Consider using a more efficient way to compare cards, like hashing the card object
  private haveSameCards(first: Card[], second: Card[]): boolean {
    if (first.length !== second.length) return false;

    const firstById = new Map(first.map((card) => [card.id, card]));
    return second.every((card) => {
      const existing = firstById.get(card.id);
      return Boolean(
        existing &&
          existing.key === card.key &&
          existing.cardType === card.cardType &&
          existing.isArchived === card.isArchived &&
          existing.isFavorite === card.isFavorite &&
          existing.order === card.order &&
          JSON.stringify(existing.value) === JSON.stringify(card.value),
      );
    });
  }
}
