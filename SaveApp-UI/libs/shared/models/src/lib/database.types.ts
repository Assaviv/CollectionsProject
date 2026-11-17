import { Card, CollectionKind } from "..";

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
  kind?: CollectionKind;
};
