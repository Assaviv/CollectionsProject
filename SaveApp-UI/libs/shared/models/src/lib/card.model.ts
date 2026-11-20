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
  /** Fractional-index rank: cards sort by rank (code unit order), then id. Changed only by create and move. */
  rank?: string;
}

export type CardDraft = Omit<Card, 'id'>;
