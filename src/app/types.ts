import { KeyValueCardComponent } from './cards/key-value-card/key-value-card.component';
import { StoryCardComponent } from './cards/story-card/story-card.component';
import { SubjectCardComponent } from './cards/subject-card/subject-card.component';
import { CardBuilderComponent } from './cards/card-builder-component';
import { CheckboxCardComponent } from './cards/checkbox-card/checkbox-card.component';
import { LinkCardComponent } from './cards/link-card/link-card.component';
import { ImageCardComponent } from './cards/image-card/image-card.component';

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
  CHECKBOX,
}

export const cardToComponentMap = new Map<
  CardType,
  typeof CardBuilderComponent
>([
  [CardType.KEY_VALUE, KeyValueCardComponent],
  [CardType.STORY, StoryCardComponent],
  [CardType.SUBJECT, SubjectCardComponent],
  [CardType.CHECKBOX, CheckboxCardComponent],
  [CardType.LINK, LinkCardComponent],
  [CardType.IMAGE, ImageCardComponent],
]);

export type Visibility = 'hidden' | 'visible';
