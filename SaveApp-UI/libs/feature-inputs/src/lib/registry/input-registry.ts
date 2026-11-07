import { Type } from "@angular/core";
import { CardType } from "@save-app/models";
import { InputBuilderComponent } from "../input/input-builder-component";
import { CheckboxInputComponent } from "../types/checkbox-input/checkbox-input.component";
import { ImageInputComponent } from "../types/image-input/image-input.component";
import { KeyValueInputComponent } from "../types/key-value-input/key-value-input.component";
import { LinkInputComponent } from "../types/link-input/link-input.component";
import { StoryInputComponent } from "../types/story-input/story-input.component";
import { SubjectInputComponent } from "../types/subject-input/subject-input.component";

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
