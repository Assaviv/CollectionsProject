import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Card, CardType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { moveItemInArray } from '@angular/cdk/drag-drop';

@Injectable({
  providedIn: 'root',
})
export class CardsManagmentService {
  private cardsBehaviorSubject!: BehaviorSubject<Card[]>;
  private inputCardBehaviorSubject!: BehaviorSubject<CardType>;

  constructor() {
    this.cardsBehaviorSubject = new BehaviorSubject<Card[]>([]);
    this.inputCardBehaviorSubject = new BehaviorSubject<CardType>(
      CardType.SUBJECT
    );
  }

  public createCard(card: Omit<Card, 'id'>): void {
    this.cardsBehaviorSubject.next([
      {
        id: uuidv4(),
        ...card,
      },
      ...this.currentCards,
    ]);
  }

  public changeInput(cardType: CardType) {
    if (cardType == null) return;

    this.inputCardBehaviorSubject.next(cardType);
  }

  public updateCard(cardToUpdate: Card): void {
    const updatedCards = this.currentCards.map((card) => {
      return card.id === cardToUpdate.id ? cardToUpdate : card;
    });

    this.cardsBehaviorSubject.next(updatedCards);
  }

  public deleteCard(id: string): void {
    this.cardsBehaviorSubject.next(
      this.currentCards.filter((card) => card.id !== id)
    );
  }

  public changeCardsOrder(previousIndex: number, currentIndex: number): void {
    moveItemInArray(this.currentCards, previousIndex, currentIndex);
  }

  public get cards$(): Observable<Card[]> {
    return this.cardsBehaviorSubject.asObservable();
  }

  public get inputType$(): BehaviorSubject<CardType> {
    return this.inputCardBehaviorSubject;
  }

  public get currentInput(): CardType {
    return this.inputCardBehaviorSubject.getValue();
  }

  private get currentCards(): Card[] {
    return this.cardsBehaviorSubject.getValue();
  }
}
