/** DEPRECATED */
export enum CollectionType {
  ANY,
}

/** Set by the server. Each user has exactly one INBOX, pinned first, which can't be deleted. */
export type CollectionKind = 'NORMAL' | 'INBOX';

export interface Collection {
  id: string;
  title: string;
  description: string;
  emoji: string;
  collectionType: CollectionType;
  backgroundColor?: string;
  kind?: CollectionKind;
}
