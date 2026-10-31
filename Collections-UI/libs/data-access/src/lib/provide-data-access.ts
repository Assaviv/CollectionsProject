import { makeEnvironmentProviders } from "@angular/core";
import { DATA_ACCESS_CONFIG, DataAccessConfig, DEFAULT_SYNC_CONFIG, SYNC_CONFIG, SyncConfig } from "./config";
import { CollectionsApi, REMOTE_COLLECTIONS_API } from "./collections-api";
import { IndexedDBCollectionsDB } from "./indexeddb-collections-db";
import { CollectionsDB } from "./collections-db";

export function provideDataAccess(config: DataAccessConfig, opts: { localFirst?: boolean; sync?: Partial<SyncConfig> } = {}) {
  const { localFirst = true, sync } = opts;
  return makeEnvironmentProviders([
    { provide: DATA_ACCESS_CONFIG, useValue: config },
    { provide: SYNC_CONFIG, useValue: { ...DEFAULT_SYNC_CONFIG, ...sync } },
    { provide: REMOTE_COLLECTIONS_API, useExisting: CollectionsDB },
    { provide: CollectionsApi, useExisting: localFirst ? IndexedDBCollectionsDB : CollectionsDB },
  ]);
}
