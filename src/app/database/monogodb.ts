import { Injectable } from '@angular/core';
import Database from './database';
import { Collection } from './types';

@Injectable({
  providedIn: 'root',
})
export class MongoDB implements Database<Collection> {
  constructor() {
    console.log();
  }

  async insert(record: Collection): Promise<void> {
    return;
  }

  async find(query: string): Promise<Collection> {
    return Promise.resolve({
      cards: [],
      description: '',
      title: '',
      emoji: '',
      userId: ' ',
    });
  }

  has(record: string): boolean {
    return false;
  }
}
