import type { DataAccessOptions } from '@save-app/data-access';

export const environment = { 
    dataAccess: {
        // Which class backs CollectionsApi: 'dexie' (local-first, separate collections/cards tables),
        // 'indexeddb' (legacy local-first store) or 'remote' (HTTP only, no offline support).
        // Both local stores use dbName with different schemas: clear the browser database when switching between them.
        store: 'dexie',
        dbName: 'CollectionsUI',          // IndexedDB database name
        dbVersion: 2,                     // schema version of the legacy 'indexeddb' store only
        pollIntervalMs: 5 * 60 * 1000,    // background sync interval; 0 turns the poll off
        unsyncedDebounceMs: 1000,         // 'dexie': delay before the "unsynced changes" indicator shows
        syncOnOnline: true,               // 'dexie': sync when the device comes back online
        syncOnVisible: true,              // 'dexie': sync when the app becomes visible again
    } satisfies DataAccessOptions,
    apiBaseUrl: '/api',
    auth: {
        enabled: false
    }
};
