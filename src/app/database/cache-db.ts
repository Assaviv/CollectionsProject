import { Injectable } from '@angular/core';
import Database from './database';
import { KeyValue } from './types';

@Injectable({
  providedIn: 'root',
})
export class CacheKeyValueDB implements Database<KeyValue> {
  map!: Map<string, string>;

  constructor() {
    this.map = new Map<string, string>();
  }

  insert(record: KeyValue): void {
    if (record.key && record.value) {
      this.map.set(record.key, record.value);
    }
  }

  find(query: string): string | null {
    return this.map.get(query) ?? null;
  }

  has(key: string): boolean {
    return this.map.has(key);
  }
}
