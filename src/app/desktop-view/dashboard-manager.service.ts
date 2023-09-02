import { Injectable } from '@angular/core';
import { Collection, bgcolor } from '../types';
import { CardsManagmentService } from '../cards/cards-managment.service';
import { CollectionsManagmentService } from '../collection/collections-managment.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardManagerService {
  collectionToCardsMap$!: Map<Collection, CardsManagmentService>;
  bgcolor!: bgcolor;

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
