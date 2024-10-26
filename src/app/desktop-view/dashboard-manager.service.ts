import { Injectable } from '@angular/core';
import { Card, Collection, CollectionType, bgcolor } from '../types';
import { Collection as DBCollection } from '../database/types';
import { CardsManagmentService } from '../cards/cards-managment.service';
import { CollectionsManagmentService } from '../collection/collections-managment.service';
import { CollectionsDB } from '../database/collections-db';
import { Observable } from 'rxjs';
import { CardsManagmentFactoryService } from '../cards/cards-managment-factory.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardManagerService {
  collectionIdToCardsMap$!: Map<string, CardsManagmentService>;
  bgcolor!: bgcolor;

  constructor(
    private collectionsManagmentService: CollectionsManagmentService,
    private cardsManagmentFactoryService: CardsManagmentFactoryService,
    database: CollectionsDB,
  ) {
    this.collectionIdToCardsMap$ = new Map([]);

    this.subscribeToDbCollections(database.retrieveCollections());
  }

  private subscribeToDbCollections(
    dbCollections: Observable<DBCollection[]>,
  ): void {
    dbCollections.subscribe((collections) => {
      collections.forEach((collection) => {
        const cardsService = this.cardsManagmentFactoryService.create(
          collection.id,
        );

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
