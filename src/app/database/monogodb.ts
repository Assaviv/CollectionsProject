import { Injectable } from '@angular/core';
import Database from './database';
import {
  Collection as MongoCollection,
  Db,
  MongoClient,
  Document,
} from 'mongodb';
import { Collection } from './types';

@Injectable({
  providedIn: 'root',
})
export class MongoDB implements Database<Collection> {
  client!: MongoClient;
  database!: Db;
  collection!: MongoCollection<Document>;

  constructor() {
    this.client = new MongoClient('mongo://27017');
    this.database = this.client.db('test');
    this.collection = this.database.collection('collections');
  }

  async insert(record: Collection): Promise<void> {
    await this.collection.insertOne(record);
  }

  async find(query: string): Promise<Collection> {
    const collection = await this.collection.findOne({ title: query });
    return collection as unknown as Collection;
  }

  has(record: string): boolean {
    return this.find(record) !== null;
  }
}
