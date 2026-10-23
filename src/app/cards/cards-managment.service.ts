import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Card } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { COLLECTION_ID } from './cards-managment-factory.service';
import { CollectionsDB } from '../database/collections-db';

@Injectable({
  providedIn: 'root',
})
export class CardsManagmentService {
  private cardsBehaviorSubject!: BehaviorSubject<Card[]>;

  constructor(
    @Inject(COLLECTION_ID) private collectionId: string,
    private database: CollectionsDB,
  ) {
    this.cardsBehaviorSubject = new BehaviorSubject<Card[]>([]);
  }

  public createExistingCard(card: Card): void {
    this.cardsBehaviorSubject.next([card, ...this.currentCards]);
  }

  public createCard(card: Omit<Card, 'id'>): void {
    const newCard: Card = {
      id: uuidv4(),
      ...card,
    };

    this.database.createCardByCollectionId(this.collectionId, newCard);

    this.createExistingCard(newCard);
  }

  public updateCard(cardToUpdate: Card): void {
    // TODO: donot update where there is no change
    // TODO: Create patch card for partial updates
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
    moveItemInArray(this.currentCards, previousIndex, currentIndex);
    // TODO: Consider changing the order system.
    // Instead of updating all cards position for big collection changes
    // Use floating point order.
    // For example, if we have 3 cards, the order will be A:1, B:2, C:3 
    // If we want to move the third card to the first, we will set the order to C:3 -> C:0.5
    // This way we can move cards without changing the order of all cards
    // The order will be calculated by the average of the previous and next card
    // The final order will look like this: C:0.5, A:1, B:2
    // Then the API will be simply update card: id to order: number
  }

  public get cards$(): Observable<Card[]> {
    return this.cardsBehaviorSubject.asObservable();
  }

  private get currentCards(): Card[] {
    return this.cardsBehaviorSubject.getValue();
  }
}
