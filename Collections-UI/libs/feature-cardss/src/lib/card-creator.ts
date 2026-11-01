import { CardDraft } from "@save-app/models";

export abstract class CardCreator {
  abstract create(draft: CardDraft): void;
}
