import { KeyValueCardComponent } from './cards/key-value-card/key-value-card.component';
import { StoryCardComponent } from './cards/story-card/story-card.component';
import { SubjectCardComponent } from './cards/subject-card/subject-card.component';
import { CardBuilderComponent } from './cards/card-builder-component';
import { CheckboxCardComponent } from './cards/checkbox-card/checkbox-card.component';
import { LinkCardComponent } from './cards/link-card/link-card.component';
import { ImageCardComponent } from './cards/image-card/image-card.component';
import { SubjectInputComponent } from './inputs/subject-input/subject-input.component';
import { InputBuilderComponent } from './inputs/input-builder-component';
import { StoryInputComponent } from './inputs/story-input/story-input.component';
import { KeyValueInputComponent } from './inputs/key-value-input/key-value-input.component';
import { CheckboxInputComponent } from './inputs/checkbox-input/checkbox-input.component';

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
  CHECKBOX,
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
  [CardType.CHECKBOX, CheckboxCardComponent],
  [CardType.LINK, LinkCardComponent],
  [CardType.IMAGE, ImageCardComponent],
]);

export const inputToComponentMap = new Map<
  CardType,
  typeof InputBuilderComponent
>([
  [CardType.SUBJECT, SubjectInputComponent],
  [CardType.STORY, StoryInputComponent],
  [CardType.KEY_VALUE, KeyValueInputComponent],
  [CardType.CHECKBOX, CheckboxInputComponent],
]);

export type Visibility = 'hidden' | 'visible';
