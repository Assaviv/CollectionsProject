import { CardType } from "@save-app/models";
import { CardBuilderComponent } from "../card/card-builder-component/card-builder-component";
import { CheckboxCardComponent } from "../types/checkbox-card/checkbox-card.component";
import { ImageCardComponent } from "../types/image-card/image-card.component";
import { KeyValueCardComponent } from "../types/key-value-card/key-value-card.component";
import { LinkCardComponent } from "../types/link-card/link-card.component";
import { StoryCardComponent } from "../types/story-card/story-card.component";
import { SubjectCardComponent } from "../types/subject-card/subject-card.component";

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
