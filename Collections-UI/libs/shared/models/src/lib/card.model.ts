export enum CardType {
  SUBJECT,
  STORY,
  KEY_VALUE,
  CHECKBOX,
  LINK,
  IMAGE,
}

export interface Card {
  id: string;
  key: string;
  value?: unknown;
  cardType: CardType;
  isArchived?: boolean;
  isFavorite?: boolean;
  order?: number
}
