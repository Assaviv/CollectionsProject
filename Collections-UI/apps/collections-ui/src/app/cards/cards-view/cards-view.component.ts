import { Component, forwardRef, inject, Input } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Card } from '@save-app/models';
import { CollectionsFacade } from '@save-app/data-access';
import { CardActions } from '@save-app/feature-cards';

@Component({
  selector: 'collections-ui-cards-view',
  templateUrl: './cards-view.component.html',
  styleUrl: './cards-view.component.scss',
  providers: [{ provide: CardActions, useExisting: forwardRef(() => CardsViewComponent) }],
})
export class CardsViewComponent implements CardActions {
  @Input() collectionId: string | null = null;
  @Input() cards: Card[] = [];

  private readonly facade = inject(CollectionsFacade);

  update(card: Card): void {
    if (this.collectionId) void this.facade.updateCard(this.collectionId, card);
  }

  remove(cardId: string): void {
    if (this.collectionId) void this.facade.deleteCard(this.collectionId, cardId);
  }

  dropCard(event: CdkDragDrop<Card[]>): void {
    if (!this.collectionId || event.previousIndex === event.currentIndex) return;
    void this.facade.reorderCards(
      this.collectionId, this.cards, event.previousIndex, event.currentIndex,
    );
  }

  trackByCardId(_: number, card: Card): string {
    return card.id;
  }
}