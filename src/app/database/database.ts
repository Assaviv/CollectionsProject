import { InjectionToken } from '@angular/core';

export default interface Database<T = unknown> {
  insert(record: T): void;
  find(query: unknown): unknown | null;
  has(record: unknown): boolean;
}

export const CACHE_DATABASE = new InjectionToken<Database>('cache database');
export const REAL_DATABASE = new InjectionToken<Database>('Real database');
