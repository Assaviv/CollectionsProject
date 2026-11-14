import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Card } from '@save-app/models';
import { CardsViewComponent } from '@save-app/feature-cards';
import { InputHostComponent } from '@save-app/feature-inputs';
import { SwipeDirective } from '../../touch-gesture/swipe.directive';

@Component({
  selector: 'save-app-mobile-cards-section',
  standalone: true,
  imports: [CardsViewComponent, InputHostComponent, SwipeDirective],
  templateUrl: './mobile-cards-section.component.html',
  styleUrl: './mobile-cards-section.component.scss',
})
export class MobileCardsSectionComponent {
  @Input() collectionId: string | null = null;
  @Input() cards: Card[] = [];
  @Input() wavesEnabled = false;
  @Output() swipeLeft = new EventEmitter<void>();
  @Output() swipeRight = new EventEmitter<void>();
}
