import { InjectionToken } from '@angular/core';

export interface DataAccessConfig {
  apiBaseUrl: string; // '/api' on web, full URL on mobile
  canSync?: () => boolean;
}
export const DATA_ACCESS_CONFIG = new InjectionToken<DataAccessConfig>('DATA_ACCESS_CONFIG');

/** Which class backs `CollectionsApi`: Dexie local-first, or HTTP only. */
export type CollectionsStore = 'dexie' | 'remote';

export interface SyncConfig {
  dbName: string;
  /** Background sync interval. 0 turns the poll off. */
  pollIntervalMs: number;
  /** How long the outbox must stay non-empty before `hasUnsyncedChanges$` reports it. */
  unsyncedDebounceMs: number;
  /** Sync when the browser comes back online. */
  syncOnOnline: boolean;
  /** Sync when the page becomes visible again. */
  syncOnVisible: boolean;
}

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  dbName: 'CollectionsUI',
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
