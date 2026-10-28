import { Card } from '../types';

export type KeyValue = {
  key?: string;
  value?: string;
};

export type Collection = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  cards: Card[];
};
