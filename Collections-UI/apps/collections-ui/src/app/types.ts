import { KeyValueCardComponent } from './cards/types/key-value-card/key-value-card.component';
import { StoryCardComponent } from './cards/types/story-card/story-card.component';
import { SubjectCardComponent } from './cards/types/subject-card/subject-card.component';
import { CheckboxCardComponent } from './cards/types/checkbox-card/checkbox-card.component';
import { LinkCardComponent } from './cards/types/link-card/link-card.component';
import { ImageCardComponent } from './cards/types/image-card/image-card.component';
import { SubjectInputComponent } from './inputs/subject-input/subject-input.component';
import { InputBuilderComponent } from './inputs/input-builder-component';
import { StoryInputComponent } from './inputs/story-input/story-input.component';
import { KeyValueInputComponent } from './inputs/key-value-input/key-value-input.component';
import { CheckboxInputComponent } from './inputs/checkbox-input/checkbox-input.component';
import { LinkInputComponent } from './inputs/link-input/link-input.component';
import { BehaviorSubject, Observable } from 'rxjs';
import { Type } from '@angular/core';
import { CardBuilderComponent } from './cards/card-builder-component/card-builder-component';
import { ImageInputComponent } from './inputs/image-input/image-input.component';
import { CardType } from '@save-app/models';

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
  Type<InputBuilderComponent>
>([
  [CardType.SUBJECT, SubjectInputComponent],
  [CardType.STORY, StoryInputComponent],
  [CardType.KEY_VALUE, KeyValueInputComponent],
  [CardType.CHECKBOX, CheckboxInputComponent],
  [CardType.LINK, LinkInputComponent],
  [CardType.IMAGE, ImageInputComponent],
]);

export type Visibility = 'hidden' | 'visible';

export interface ManagmentService<T> {
  subject: BehaviorSubject<T[]>;

  addItem(subjectInput: Omit<T, 'id'>): void;
  deleteItem(id: string): void;
  get items$(): Observable<T[]>;
  get currentItems(): T[];
}

export type bgcolor = 'electric-violet' | 'juicy-orange' | 'mojito' | 'cherry' | 'modern-bg' | 'dark-mode';
