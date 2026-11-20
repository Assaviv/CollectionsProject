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
  /** Set by the server; the client's source of truth for order is the position in the cards array. */
  position?: number;
}

export type CardDraft = Omit<Card, 'id'>;
