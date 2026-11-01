import { Directive, forwardRef, inject, Input } from '@angular/core';
import { Card } from '@save-app/models';
import { CollectionsFacade } from '@save-app/data-access';
import { CardActions } from './card-actions';

@Directive({
  selector: '[collectionCardActions]',
  standalone: true,
  providers: [{ provide: CardActions, useExisting: forwardRef(() => CollectionCardActionsDirective) }],
})
export class CollectionCardActionsDirective implements CardActions {
  @Input({ required: true, alias: 'collectionCardActions' }) collectionId!: string;
  private readonly facade = inject(CollectionsFacade);

  update(card: Card) { void this.facade.updateCard(this.collectionId, card); }
  remove(id: string) { void this.facade.deleteCard(this.collectionId, id); }
}
