import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { inputToComponentMap } from '../types';
import { CardType } from '@save-app/models';

@Injectable({
  providedIn: 'root',
})
export class InputsManagmentService {
  private cardTypeIndex = 0;

  private inputCardBehaviorSubject!: BehaviorSubject<CardType>;

  constructor() {
    this.inputCardBehaviorSubject = new BehaviorSubject<CardType>(
      CardType.SUBJECT,
    );
  }

  public changeInput(cardType: CardType) {
    if (cardType == null) return;

    this.inputCardBehaviorSubject.next(cardType);
  }

  public changeToNextInput() {
    this.changeInput(this.nextCardType);
  }

  public changeToPreviousInput() {
    this.changeInput(this.prevCardType);
  }

  public get inputType$(): BehaviorSubject<CardType> {
    return this.inputCardBehaviorSubject;
  }

  public get currentInput(): CardType {
    return this.inputCardBehaviorSubject.getValue();
  }

  private get nextCardType(): CardType {
    this.cardTypeIndex++;
    this.cardTypeIndex %= inputToComponentMap.size;

    return this.cardTypeIndex;
  }

  private get prevCardType(): CardType {
    this.cardTypeIndex--;

    if (this.cardTypeIndex === -1) {
      this.cardTypeIndex = inputToComponentMap.size - 1;
    }

    return this.cardTypeIndex;
  }
}
