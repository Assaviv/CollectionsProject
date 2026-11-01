import { Card } from "..";

export type KeyValue = {
  key?: string;
  value?: string;
};

export type DBCollection = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  cards: Card[];
};
