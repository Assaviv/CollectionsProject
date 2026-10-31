import { Card } from '@save-app/models';

export type KeyValue = {
  key?: string;
  value?: string;
};

// TODO get rid pf this
export type Collection = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  cards: Card[];
};
