import { Injectable } from '@angular/core';
import { Card, Collection, CollectionType, bgcolor } from '../types';
import { Collection as DBCollection } from '../database/types';
import { CardsManagmentService } from '../cards/cards-managment.service';
import { CollectionsManagmentService } from '../collection/collections-managment.service';
import { MongoDB } from '../database/monogodb';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardManagerService {
  collectionIdToCardsMap$!: Map<string, CardsManagmentService>;
  bgcolor!: bgcolor;

  constructor(
    private collectionsManagmentService: CollectionsManagmentService,
    private database: MongoDB,
  ) {
    this.collectionIdToCardsMap$ = new Map([]);

    this.subscribeToDbCollections(database.getCollections());
  }

  private subscribeToDbCollections(
    dbCollections: Observable<DBCollection[]>,
  ): void {
    dbCollections.subscribe((collections) => {
      collections.forEach((collection) => {
        const cardsService = new CardsManagmentService(this.database);

        collection.cards.forEach((card) =>
          cardsService.createExistingCard(card),
        );

        this.mapService(collection.id, cardsService);

        this.collectionsManagmentService.addExistingItem({
          collectionType: CollectionType.ANY,
          ...collection,
        });
      });
    });
  }

  public getService(collectionId: string): CardsManagmentService | undefined {
    return this.collectionIdToCardsMap$.get(collectionId);
  }

  public mapService(
    collectionId: string,
    cardsManagmentService: CardsManagmentService,
  ) {
    this.collectionIdToCardsMap$.set(collectionId, cardsManagmentService);
  }

  public get currentCardsService(): CardsManagmentService | undefined {
    return this.getService(this.selectedCollection.id);
  }

  public get selectedCollection(): Collection {
    return this.collectionsManagmentService.selectedCollection.getValue();
  }

  public get currentBgcolor(): string {
    return this.bgcolor;
  }

  public set setBgcolor(color: bgcolor) {
    this.bgcolor = color;
  }
}
