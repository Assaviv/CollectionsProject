import { inject, Injectable } from '@angular/core';
import { CollectionsFacade } from '@save-app/data-access';
import { CardCreator } from '@save-app/feature-cards';
import { CollectionSelection } from '@save-app/feature-collections';
import { CardDraft } from '@save-app/models';

@Injectable({ providedIn: 'root' })
export class SelectedCollectionCardCreator extends CardCreator {
  private readonly facade = inject(CollectionsFacade);
  private readonly selection = inject(CollectionSelection);

  create(draft: CardDraft): void {
    const id = this.selection.selectedId();
    if (id) void this.facade.createCard(id, draft);
  }
}
