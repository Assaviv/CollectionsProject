import { Injectable } from '@angular/core';
import { CardsManagmentService } from '../cards/cards-managment.service';
import { CollectionsManagmentService } from '../collection/collections-managment.service';
import { IndexedDBCollectionsDB } from '@save-app/data-access';
import { Observable } from 'rxjs';
import { CardsManagmentFactoryService } from '../cards/cards-managment-factory.service';
import { bgcolor, Collection, CollectionType, DBCollection } from '@save-app/models';

@Injectable({
  providedIn: 'root',
})
export class DashboardManagerService {
  collectionIdToCardsMap$!: Map<string, CardsManagmentService>;
  bgcolor!: bgcolor;

  constructor(
    private collectionsManagmentService: CollectionsManagmentService,
    private cardsManagmentFactoryService: CardsManagmentFactoryService,
    database: IndexedDBCollectionsDB,
  ) {
    this.collectionIdToCardsMap$ = new Map([]);

    this.subscribeToDbCollections(database.retrieveCollections());
  }

  private subscribeToDbCollections(
    dbCollections: Observable<DBCollection[]>,
  ): void {
    dbCollections.subscribe((collections) => {
      collections.forEach((collection) => {
        let cardsService = this.getService(collection.id);
        if (!cardsService) {
          cardsService = this.cardsManagmentFactoryService.create(collection.id);
          this.mapService(collection.id, cardsService);
        }
        cardsService.replaceExistingCards(collection.cards ?? []);
      });

      this.collectionsManagmentService.replaceExistingItems(
        collections.map((collection) => ({
          collectionType: CollectionType.ANY,
          ...collection,
        })),
      );
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
    const selectedCollection = this.selectedCollection;
    return selectedCollection
      ? this.getService(selectedCollection.id)
      : undefined;
  }

  public get selectedCollection(): Collection | null {
    return this.collectionsManagmentService.selectedCollection?.getValue();
  }

  public get currentBgcolor(): string {
    return this.bgcolor;
  }

  public set setBgcolor(color: bgcolor) {
    this.bgcolor = color;
  }
}
