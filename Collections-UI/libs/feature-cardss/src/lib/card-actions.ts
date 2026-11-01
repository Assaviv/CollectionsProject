import { Card } from '@save-app/models';

export abstract class CardActions {
  abstract update(card: Card): void;
  abstract remove(cardId: string): void;
}
