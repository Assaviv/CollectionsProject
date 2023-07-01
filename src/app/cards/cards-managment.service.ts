import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Card } from '../types';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class CardsManagmentService {
  private cardsBehaviorSubject!: BehaviorSubject<Card[]>;

  constructor() {
    this.cardsBehaviorSubject = new BehaviorSubject<Card[]>([]);
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

  public get cards$(): Observable<Card[]> {
    return this.cardsBehaviorSubject.asObservable();
  }

  private get currentCards(): Card[] {
    return this.cardsBehaviorSubject.getValue();
  }
}
