import { InjectionToken } from '@angular/core';

export interface DataAccessConfig {
  apiBaseUrl: string; // '/api' on web, full URL on mobile
  canSync?: () => boolean;
}
export const DATA_ACCESS_CONFIG = new InjectionToken<DataAccessConfig>('DATA_ACCESS_CONFIG');

/** Which class backs `CollectionsApi`: Dexie local-first, the legacy hand-written IndexedDB store, or HTTP only. */
export type CollectionsStore = 'dexie' | 'indexeddb' | 'remote';

export interface SyncConfig {
  dbName: string;
  /** Schema version of the legacy `indexeddb` store only; the Dexie store owns its own schema version. */
  dbVersion: number;
  /** Background sync interval. 0 turns the poll off. */
  pollIntervalMs: number;
  /** Dexie store only: how long the outbox must stay non-empty before `hasUnsyncedChanges$` reports it. */
  unsyncedDebounceMs: number;
  /** Dexie store only: sync when the browser comes back online. */
  syncOnOnline: boolean;
  /** Dexie store only: sync when the page becomes visible again. */
  syncOnVisible: boolean;
}

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  dbName: 'CollectionsUI',
  dbVersion: 2,
  pollIntervalMs: 5 * 60 * 1000,
  unsyncedDebounceMs: 1000,
  syncOnOnline: true,
  syncOnVisible: true,
};

/** Options for `provideDataAccess`, normally taken straight from `environment.dataAccess`. */
export interface DataAccessOptions extends Partial<SyncConfig> {
  store?: CollectionsStore;
}

export const SYNC_CONFIG = new InjectionToken<SyncConfig>('SYNC_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_SYNC_CONFIG,
});
