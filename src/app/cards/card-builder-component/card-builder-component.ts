import { Component, Input, OnInit } from '@angular/core';
import { Card, Visibility } from '../../types';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { DashboardManagerService } from '../../desktop-view/dashboard-manager.service';

@Component({
  selector: 'collections-ui-card-builder',
  templateUrl: './card-builder.component.html',
  styleUrls: ['./card-builder.component.scss'],
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

    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('250ms ease-in', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('250ms ease-out', style({ opacity: 0 }))]),
    ]),
  ],
})
export class CardBuilderComponent implements OnInit {
  @Input() card!: Card;

  cardState: Visibility = 'hidden';
  isReadOnly: boolean = true;
  isToolBoxVisible: boolean = false;

  constructor(protected dashboardManagerService: DashboardManagerService) {}

  ngOnInit(): void {
    if (this.card.id === 'demo') {
      // demo - null object?
      this.cardState = 'visible';
    }
    setTimeout(() => {
      this.cardState = 'visible';
    }, 0);
  }

  delete(): void {
    if (this.card.id === 'demo') return;

    this.cardState = 'hidden';
    setTimeout(
      () =>
        this.dashboardManagerService.currentCardsService?.deleteCard(
          this.card.id,
        ),
      300,
    );
  }

  edit() {
    if (!this.isReadOnly) {
      this.dashboardManagerService.currentCardsService?.updateCard(this.card);
    }

    this.isReadOnly = !this.isReadOnly;
  }

  toolBox() {
    this.isToolBoxVisible = !this.isToolBoxVisible;
  }
}
