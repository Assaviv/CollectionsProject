import { Injectable, OnInit } from '@angular/core';
import { Card, CardType, Collection, CollectionType } from '../types';
import { CardsManagmentService } from '../cards/cards-managment.service';
import { CollectionsManagmentService } from '../collection/collections-managment.service';

@Injectable({
  providedIn: 'root',
})
export class FakeDataService {
  collections!: Omit<Collection, 'id'>[];
  cards!: Omit<Card, 'id'>[];

  constructor(
    private cardsManagmentService: CardsManagmentService,
    private collectionsManagmentService: CollectionsManagmentService
  ) {
    this.setupFakeCollections();
    this.setupFakeCards();
  }

  public createFakeData(): void {
    this.createFakeCollections();
    // this.createFakeCards();
  }

  private createFakeCards(): void {
    this.cards.forEach((card: Omit<Card, 'id'>) =>
      this.cardsManagmentService.createCard(card)
    );
  }

  private createFakeCollections(): void {
    this.collections.forEach((collection: Omit<Collection, 'id'>) =>
      this.collectionsManagmentService.addItem(collection)
    );
  }

  private setupFakeCollections(): void {
    this.collections = [
      {
        title: 'My first collection',
        description:
          'Owesome collection for some shit and stuff you know what i mean..',
        collectionType: CollectionType.ANY,
      },
      {
        title: 'My second collection',
        description:
          'Owesome collection for some shit and stuff you know what i mean..',
        collectionType: CollectionType.ANY,
      },
      {
        title: 'My third collection',
        description:
          'Owesome collection for some shit and stuff you know what i mean..',
        collectionType: CollectionType.ANY,
      },
      {
        title: 'My forth collection',
        description:
          'Owesome collection for some shit and stuff you know what i mean..',
        collectionType: CollectionType.ANY,
      },
      {
        title: 'Short',
        description:
          'LONGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
        collectionType: CollectionType.ANY,
      },
      {
        description: 'Short',
        title:
          'LONGGGGGG GGG s s sss sss s ssssss sss sssss ssssss sssss sss ss',
        collectionType: CollectionType.ANY,
      },
    ];
  }
  private setupFakeCards(): void {
    this.cards = [
      {
        cardType: CardType.CHECKBOX,
        key: 'checkbox green or red',
        value: true,
      },
      {
        key: 'Title',
        value: 'Body',
        cardType: CardType.STORY,
      },
      {
        key: 'Hello world',
        value: 'lorem ipsum d   Prometheus        Lore     Ipsum Ips     ',
        cardType: CardType.SUBJECT,
      },
      {
        key: 'Title',
        value:
          'Bodysasssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss',
        cardType: CardType.KEY_VALUE,
      },
      {
        key: ' s s s s s s s s s s s s s s s s s s s',
        value: '.sa.ds .asd sd .asd. as,.d ,sa.d .s,d .as\n\n\nsadsdasdas',
        cardType: CardType.KEY_VALUE,
      },
      {
        key: 'Title',
        value:
          'qqqqqqqqqqqqqqqqqqqqqqqq... asd d as a d qqqqqqqqqqqqqqq   q    q q q q q q q q q q q q q q q q q d dd dd dd dd  ',
        cardType: CardType.KEY_VALUE,
      },
      {
        key: 'Title',
        value:
          'qqqqqqqqqqqqqqqqqqqqqqqq... asd d as a d qqqqqqqqqqqqqqq   q    q q q q q q q q q q q q q q q q q d dd dd dd dd  ',
        cardType: CardType.KEY_VALUE,
      },
      {
        key: 'Title',
        value:
          'qqqqqqqqqqqqqqqqqqqqqqqq... asd d as a d qqqqqqqqqqqqqqq   q    q q q q q q q q q q q q q q q q q d dd dd dd dd  ',
        cardType: CardType.KEY_VALUE,
      },
      {
        key: 'ENNDDDDDd',
        value:
          'qqqqqqqqqqqqqqqqqqqqqqqq... asd d as a d qqqqqqqqqqqqqqq   q    q q q q q q q q q q q q q q q q q d dd dd dd dd  ',
        cardType: CardType.KEY_VALUE,
      },
      {
        key: 'Google',
        value: 'http://www.google.com',
        cardType: CardType.LINK,
      },
      {
        key: 'Twitter',
        value: 'http://twitter.com',
        cardType: CardType.LINK,
      },
      // {
      //   key: 'Image',
      //   value:
      //     'https://i.pinimg.com/736x/a2/e5/3a/a2e53a125f14c946cada10acf5db59cb--roller-coasters-rollers.jpg',
      //   cardType: CardType.IMAGE,
      // },
    ];
  }
}
