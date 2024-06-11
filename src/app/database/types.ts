import { Card } from '../types';

export type KeyValue = {
  key?: string;
  value?: string;
};

export type Collection = {
  userId: string;
  title: string;
  description: string;
  emoji: string;
  cards: Card[];
};
