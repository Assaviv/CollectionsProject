import { Injectable } from '@angular/core';
import { Collection, bgcolor } from '../types';
import { CardsManagmentService } from '../cards/cards-managment.service';
import { CollectionsManagmentService } from '../collection/collections-managment.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardManagerService {
  collectionIdToCardsMap$!: Map<string, CardsManagmentService>;
  bgcolor!: bgcolor;

  constructor(
    private collectionsManagmentService: CollectionsManagmentService
  ) {
    this.collectionIdToCardsMap$ = new Map([]);
  }

  public getService(collectionId: string): CardsManagmentService | undefined {
    return this.collectionIdToCardsMap$.get(collectionId);
  }

  public mapService(
    collectionId: string,
    cardsManagmentService: CardsManagmentService
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
