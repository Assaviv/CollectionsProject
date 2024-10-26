import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Card } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { MongoDB } from '../database/monogodb';

@Injectable({
  providedIn: 'root',
})
export class CardsManagmentService {
  private cardsBehaviorSubject!: BehaviorSubject<Card[]>;

  constructor(private database: MongoDB) {
    this.cardsBehaviorSubject = new BehaviorSubject<Card[]>([]);
  }

  public createExistingCard(card: Card): void {
    this.cardsBehaviorSubject.next([card, ...this.currentCards]);
  }

  public createCard(card: Omit<Card, 'id'>): void {
    // TODO: Find a way to know which collection id this card belongs to.
    const newCard: Card = {
      id: uuidv4(),
      ...card,
    };

    this.createExistingCard(newCard);
  }

  public updateCard(cardToUpdate: Card): void {
    const updatedCards = this.currentCards.map((card) => {
      return card.id === cardToUpdate.id ? cardToUpdate : card;
    });

    this.cardsBehaviorSubject.next(updatedCards);
  }

  public deleteCard(id: string): void {
    this.cardsBehaviorSubject.next(
      this.currentCards.filter((card) => card.id !== id),
    );
  }

  public changeCardsOrder(previousIndex: number, currentIndex: number): void {
    moveItemInArray(this.currentCards, previousIndex, currentIndex);
  }

  public get cards$(): Observable<Card[]> {
    return this.cardsBehaviorSubject.asObservable();
  }

  private get currentCards(): Card[] {
    return this.cardsBehaviorSubject.getValue();
  }
}
