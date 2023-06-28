import { KeyValueCardComponent } from './cards/key-value-card/key-value-card.component';
import { StoryCardComponent } from './cards/story-card/story-card.component';
import { SubjectCardComponent } from './cards/subject-card/subject-card.component';
import { CardBuilderComponent } from './cards/card-builder-component';

export interface Card {
  id: string;
  key: string;
  value?: unknown;
  cardType: CardType;
}

export enum CardType {
  KEY_VALUE,
  STORY,
  SUBJECT,
  LINK,
  IMAGE,
}

export const cardToComponentMap = new Map<
  CardType,
  typeof CardBuilderComponent
>([
  [CardType.KEY_VALUE, KeyValueCardComponent],
  [CardType.STORY, StoryCardComponent],
  [CardType.SUBJECT, SubjectCardComponent],
]);
