import { Component, Input, OnInit } from '@angular/core';
import { CardType, Visibility } from '../types';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { DashboardManagerService } from '../desktop-view/dashboard-manager.service';

@Component({
  template: '',
  animations: [
    trigger('cardAnimation', [
      state(
        'visible',
        style({
          opacity: 1,
          transform: 'scale(1)',
        }),
      ),
      state(
        'hidden',
        style({
          opacity: 0,
          transform: 'scale(0)',
        }),
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
  isReadOnly: boolean = true;

  constructor(private dashboardManagerService: DashboardManagerService) {}

  ngOnInit(): void {
    if (this.id === 'demo') {
      // demo - null object?
      this.cardState = 'visible';
    }
    setTimeout(() => {
      this.cardState = 'visible';
    }, 0);
  }

  delete(): void {
    if (this.id === 'demo') return;

    this.cardState = 'hidden';
    setTimeout(
      () =>
        this.dashboardManagerService.currentCardsService?.deleteCard(this.id),
      300,
    );
  }

  edit() {
    if (!this.isReadOnly) {
      this.dashboardManagerService.currentCardsService?.updateCard(this);
    }

    this.isReadOnly = !this.isReadOnly;
  }
}
