/** DEPRECATED */
export enum CollectionType {
  ANY,
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  emoji: string;
  collectionType: CollectionType;
  backgroundColor?: string;
}
