import { Component, HostListener, Injector, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../login/login.service';
import { FormArray } from '@angular/forms';
import {
  CardType,
  Collection,
  CollectionType,
  inputToComponentMap,
} from '../types';
import { CardsManagmentService } from '../cards/cards-managment.service';
import { Card } from '../types';
import { Observable } from 'rxjs';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { InputBuilderComponent } from '../inputs/input-builder-component';
import { CollectionsManagmentService } from '../collection/collections-managment.service';
import { InputsManagmentService } from '../inputs/inputs-managment.service';
import { MatDialog } from '@angular/material/dialog';
import { CollectionPopupComponent } from '../collection-popup/collection-popup.component';

@Component({
  selector: 'collections-ui-desktop-view',
  templateUrl: './desktop-view.component.html',
  styleUrls: ['./desktop-view.component.scss'],
})
export class DesktopViewComponent implements OnInit {
  // cardsFormArray: FormArray;
  genericCards!: Observable<Card[]>;
  genericCollections!: Observable<Collection[]>;
  cardTypes = [
    CardType.SUBJECT,
    CardType.STORY,
    CardType.KEY_VALUE,
    CardType.CHECKBOX,
    CardType.LINK,
  ]; // temp until all resolved then use inputToComp...
  cardTypeIndex = 0;
  dynamicComponentInjector: Injector;
  inputComponent!: typeof InputBuilderComponent | null;

  constructor(
    private injector: Injector,
    private router: Router,
    private loginService: LoginService,
    private dialog: MatDialog,
    private cardManagmentService: CardsManagmentService,
    private inputsManagmentService: InputsManagmentService,
    private collectionsManagmentService: CollectionsManagmentService
  ) {
    this.inputsManagmentService.inputType$.subscribe((inputType) => {
      this.inputComponent = inputToComponentMap.get(inputType) ?? null;
    });
    this.dynamicComponentInjector = Injector.create({
      providers: [
        { provide: 'cardType', useValue: inputsManagmentService.inputType$ },
      ],
      parent: this.injector,
    });
    // if (loginService.getUsername === undefined) {
    //   router.navigate(['/login']);
    // }
    // this.cardsFormArray = new FormArray();
  }

  ngOnInit(): void {
    this.genericCards = this.cardManagmentService.cards$;
    this.genericCollections = this.collectionsManagmentService.items$;
    this.openPopup();
    const collections: Omit<Collection, 'id'>[] = [
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

    const cards: Omit<Card, 'id'>[] = [
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

    cards.forEach((card: Omit<Card, 'id'>) =>
      this.cardManagmentService.createCard(card)
    );

    collections.forEach((coll) =>
      this.collectionsManagmentService.addItem(coll)
    );
  }

  dropCard(event: CdkDragDrop<Card[]>) {
    this.cardManagmentService.changeCardsOrder(
      event.previousIndex,
      event.currentIndex
    );
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp':
        // case 'ArrowRight':
        this.inputsManagmentService.changeInput(this.nextCardType);
        break;
      case 'ArrowDown':
        // case 'ArrowLeft':
        this.inputsManagmentService.changeInput(this.prevCardType);
        break;
      default:
        break;
    }
  }

  openPopup() {
    this.dialog.closeAll();
    this.dialog.open(CollectionPopupComponent);
  }

  get nextCardType(): CardType {
    this.cardTypeIndex++;
    this.cardTypeIndex %= this.cardTypes.length;

    return this.cardTypeIndex;
  }

  get prevCardType(): CardType {
    this.cardTypeIndex--;

    if (this.cardTypeIndex === -1) {
      this.cardTypeIndex = this.cardTypes.length - 1;
    }

    return this.cardTypeIndex;
  }
}
