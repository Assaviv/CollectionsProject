import { Component, Input, OnInit } from '@angular/core';
import { CardType, Visibility } from '../types';
import { CardsManagmentService } from './cards-managment.service';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

@Component({
  template: '',
  animations: [
    trigger('cardAnimation', [
      state(
        'visible',
        style({
          opacity: 1,
          transform: 'scale(1)',
        })
      ),
      state(
        'hidden',
        style({
          opacity: 0,
          transform: 'scale(0)',
        })
      ),
      transition('hidden => visible', [animate('0.3s ease-in')]),
      transition('visible => hidden', [animate('0.3s ease-out')]),
    ]),
  ],
})
export class CardBuilderComponent implements OnInit {
  @Input() cardType!: CardType;
  @Input() key!: string;
  @Input() value?: unknown;
  @Input() id!: string;
  cardState: Visibility = 'hidden';

  constructor(private cardsManagmentService: CardsManagmentService) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.cardState = 'visible';
    }, 0);
  }

  delete(): void {
    this.cardState = 'hidden';
    setTimeout(() => this.cardsManagmentService.deleteCard(this.id), 300);
  }
}
