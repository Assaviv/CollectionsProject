import { makeEnvironmentProviders, Type } from "@angular/core";
import { CollectionsStore, DATA_ACCESS_CONFIG, DataAccessConfig, DataAccessOptions, DEFAULT_SYNC_CONFIG, SYNC_CONFIG } from "./config";
import { CollectionsApi, REMOTE_COLLECTIONS_API } from "./collections-api";
import { IndexedDBCollectionsDB } from "./indexeddb-collections-db";
import { DexieCollectionsDB } from "./dexie-collections-db";
import { CollectionsDB } from "./collections-db";

const STORES: Record<CollectionsStore, Type<CollectionsApi>> = {
  dexie: DexieCollectionsDB,
  indexeddb: IndexedDBCollectionsDB,
  remote: CollectionsDB,
};

export function provideDataAccess(config: DataAccessConfig, { store = 'indexeddb', ...sync }: DataAccessOptions = {}) {
  return makeEnvironmentProviders([
    { provide: DATA_ACCESS_CONFIG, useValue: config },
    { provide: SYNC_CONFIG, useValue: { ...DEFAULT_SYNC_CONFIG, ...sync } },
    { provide: REMOTE_COLLECTIONS_API, useExisting: CollectionsDB },
    { provide: CollectionsApi, useExisting: STORES[store] },
  ]);
}
