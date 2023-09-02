import { Injectable } from '@angular/core';
import { Collection } from '../types';
import { CardsManagmentService } from '../cards/cards-managment.service';
import { CollectionsManagmentService } from '../collection/collections-managment.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardManagerService {
  collectionToCardsMap$!: Map<Collection, CardsManagmentService>;

  constructor(
    private collectionsManagmentService: CollectionsManagmentService
  ) {
    this.collectionToCardsMap$ = new Map([]);
  }

  public getService(collection: Collection): CardsManagmentService | undefined {
    return this.collectionToCardsMap$.get(collection);
  }

  public mapService(
    collection: Collection,
    cardsManagmentService: CardsManagmentService
  ) {
    this.collectionToCardsMap$.set(collection, cardsManagmentService);
  }

  public get currentCardsService(): CardsManagmentService | undefined {
    return this.getService(this.selectedCollection);
  }

  get selectedCollection(): Collection {
    return this.collectionsManagmentService.selectedCollection.getValue();
  }
}
