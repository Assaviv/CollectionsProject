import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CardType } from '../types';

@Injectable({
  providedIn: 'root',
})
export class InputsManagmentService {
  private inputCardBehaviorSubject!: BehaviorSubject<CardType>;

  constructor() {
    this.inputCardBehaviorSubject = new BehaviorSubject<CardType>(
      CardType.SUBJECT
    );
  }

  public changeInput(cardType: CardType) {
    if (cardType == null) return;

    this.inputCardBehaviorSubject.next(cardType);
  }

  public get inputType$(): BehaviorSubject<CardType> {
    return this.inputCardBehaviorSubject;
  }

  public get currentInput(): CardType {
    return this.inputCardBehaviorSubject.getValue();
  }
}
