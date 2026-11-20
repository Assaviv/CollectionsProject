import type { DataAccessOptions } from '@save-app/data-access';

export const environment = { 
    dataAccess: {
        // Which class backs CollectionsApi: 'dexie' (local-first, separate collections/cards tables)
        // or 'remote' (HTTP only, no offline support).
        store: 'dexie',
        dbName: 'CollectionsUI',          // IndexedDB database name
        pollIntervalMs: 5 * 60 * 1000,    // background sync interval; 0 turns the poll off
        unsyncedDebounceMs: 1000,         // delay before the "unsynced changes" indicator shows
        syncOnOnline: true,               // sync when the device comes back online
        syncOnVisible: true,              // sync when the app becomes visible again
    } satisfies DataAccessOptions,
    apiBaseUrl: '/api',
    auth: {
        enabled: true,
        url: "https://keycloak-collections.dev.localhost:8080/",
        realm: "save-app",
        clientId: "save-app-ui"
    }
};
