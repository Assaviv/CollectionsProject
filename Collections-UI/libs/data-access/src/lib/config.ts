import { InjectionToken } from '@angular/core';

export interface DataAccessConfig {
  apiBaseUrl: string; // '/api' on web, full URL on mobile
}
export const DATA_ACCESS_CONFIG = new InjectionToken<DataAccessConfig>('DATA_ACCESS_CONFIG');

export interface SyncConfig {
  dbName: string;
  dbVersion: number;
  pollIntervalMs: number;
}

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  dbName: 'CollectionsUI',
  dbVersion: 2,
  pollIntervalMs: 5 * 60 * 1000,
};

export const SYNC_CONFIG = new InjectionToken<SyncConfig>('SYNC_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_SYNC_CONFIG,
});
