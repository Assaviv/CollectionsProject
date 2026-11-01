import { Component, inject, Input, OnInit } from '@angular/core';
import { Card, Visibility } from '@save-app/models';
import {
  animate,
  state,
  style,
  transition,
  trigger,
  AnimationEvent,
} from '@angular/animations';
import { CardActions } from '@save-app/feature-cards';
import { CardControlsComponent } from '@save-app/ui';
import { NgClass, NgIf, NgStyle } from '@angular/common';
import { ToolBoxComponent } from '../../tool-box/tool-box.component';

@Component({
  selector: 'collections-ui-card-builder',
  standalone: true,
  imports: [NgIf, NgClass, NgStyle, CardControlsComponent, ToolBoxComponent],
  templateUrl: './card-builder.component.html',
  styleUrls: ['./card-builder.component.scss'],
  animations: [
    trigger('cardAnimation', [
      state('visible', style({ opacity: 1, transform: 'scale(1)' })),
      state('hidden', style({ opacity: 0, transform: 'scale(0)' })),
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

  protected readonly actions = inject(CardActions);

  cardState: Visibility = 'hidden';
  isReadOnly = true;
  isToolBoxVisible = false;
  private deleting = false;

  ngOnInit(): void {
    setTimeout(() => (this.cardState = 'visible'), 0);
  }

  delete(): void {
    this.deleting = true;
    this.cardState = 'hidden'; // the actual removal happens in onAnimationDone
  }

  onAnimationDone(event: AnimationEvent): void {
    if (this.deleting && event.toState === 'hidden') {
      this.actions.remove(this.card.id);
    }
  }

  edit(): void {
    if (!this.isReadOnly) {
      this.actions.update(this.card);
    }
    this.isReadOnly = !this.isReadOnly;
  }

  toolBox(): void {
    this.isToolBoxVisible = !this.isToolBoxVisible;
  }
}
