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
import { LinkInputComponent } from './inputs/link-input/link-input.component';
import { BehaviorSubject, Observable } from 'rxjs';
import { Type } from '@angular/core';

export interface Card {
  id: string;
  key: string;
  value?: unknown;
  cardType: CardType;
  isArchived?: boolean;
  isFavorite?: boolean;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  emoji: string;
  collectionType: CollectionType;
  backgroundColor?: string;
}

export enum CardType {
  SUBJECT,
  STORY,
  KEY_VALUE,
  CHECKBOX,
  LINK,
  // IMAGE,
}

// TODO: Add more collection configs like only checkbox
export enum CollectionType {
  ANY,
}

export const DEFUALT_COLLECTION: Collection = {
  id: 'demo',
  emoji: '🫠',
  collectionType: CollectionType.ANY,
  title: 'Defualt',
  description:
    'This is the defualt collection, it contains any card you ever written.',
};

export const cardToComponentMap = new Map<
  CardType,
  typeof CardBuilderComponent
>([
  [CardType.KEY_VALUE, KeyValueCardComponent],
  [CardType.STORY, StoryCardComponent],
  [CardType.SUBJECT, SubjectCardComponent],
  [CardType.CHECKBOX, CheckboxCardComponent],
  [CardType.LINK, LinkCardComponent],
  // [CardType.IMAGE, ImageCardComponent],
]);

export const inputToComponentMap = new Map<
  CardType,
  Type<InputBuilderComponent>
>([
  [CardType.SUBJECT, SubjectInputComponent],
  [CardType.STORY, StoryInputComponent],
  [CardType.KEY_VALUE, KeyValueInputComponent],
  [CardType.CHECKBOX, CheckboxInputComponent],
  [CardType.LINK, LinkInputComponent],
]);

export type Visibility = 'hidden' | 'visible';

export interface ManagmentService<T> {
  subject: BehaviorSubject<T[]>;

  addItem(subjectInput: Omit<T, 'id'>): void;
  deleteItem(id: string): void;
  get items$(): Observable<T[]>;
  get currentItems(): T[];
}

export type bgcolor = 'electric-violet' | 'juicy-orange' | 'mojito' | 'cherry';
