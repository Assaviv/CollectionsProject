import { Component, HostListener, Injector, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../login/login.service';
import { FormArray } from '@angular/forms';
import {
  CardType,
  Collection,
  DEFUALT_COLLECTION,
  inputToComponentMap,
} from '../types';
import { CardsManagmentService } from '../cards/cards-managment.service';
import { Card } from '../types';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { InputBuilderComponent } from '../inputs/input-builder-component';
import { CollectionsManagmentService } from '../collection/collections-managment.service';
import { InputsManagmentService } from '../inputs/inputs-managment.service';
import { MatDialog } from '@angular/material/dialog';
import { CollectionPopupComponent } from '../collection-popup/collection-popup.component';
import { FakeDataService } from './fake-data.service';
import { DashboardManagerService } from './dashboard-manager.service';

@Component({
  selector: 'collections-ui-desktop-view',
  templateUrl: './desktop-view.component.html',
  styleUrls: ['./desktop-view.component.scss'],
})
export class DesktopViewComponent {
  // cardsFormArray: FormArray;
  cardsBehaviorSubject!: BehaviorSubject<Observable<Card[]> | undefined>;
  genericCards!: Observable<Card[]> | undefined;
  genericCollections!: Observable<Collection[]>;

  cardTypes = [
    CardType.SUBJECT,
    CardType.STORY,
    CardType.KEY_VALUE,
    CardType.CHECKBOX,
    CardType.LINK,
  ]; // temp until all resolved then use inputToComp...
  cardTypeIndex = 0;
  dynamicComponentInjector!: Injector;
  inputComponent!: typeof InputBuilderComponent | null;

  constructor(
    private injector: Injector,
    private router: Router,
    private loginService: LoginService,
    private dialog: MatDialog,
    private fakeDataService: FakeDataService,
    private cardManagmentService: CardsManagmentService,
    private inputsManagmentService: InputsManagmentService,
    protected dashboardManagerService: DashboardManagerService,
    private collectionsManagmentService: CollectionsManagmentService
  ) {
    this.fakeDataService.createFakeData();
    this.setupInput();
    this.setupCollections();
    this.setupList();

    // if (loginService.getUsername === undefined) {
    //   router.navigate(['/login']);
    // }
    // this.cardsFormArray = new FormArray();
  }

  private setupInput(): void {
    this.inputsManagmentService.inputType$.subscribe((inputType) => {
      this.inputComponent = inputToComponentMap.get(inputType) ?? null;
    });

    this.dynamicComponentInjector = Injector.create({
      providers: [
        {
          provide: 'cardType',
          useValue: this.inputsManagmentService.inputType$,
        },
      ],
      parent: this.injector,
    });
  }

  private setupCollections(): void {
    // Setup show collections
    this.genericCollections = this.collectionsManagmentService.items$;
  }

  private setupList(): void {
    // Setup main list stream
    // cards$ getting updates after createCard is called, recursion.
    this.cardManagmentService.cards$.subscribe((cards) => {
      const card = cards.pop();

      if (card) {
        this.dashboardManagerService.currentCardsService?.createCard(card);
      }
    });

    this.collectionsManagmentService.selectedCollection.subscribe(
      (collection: Collection) => {
        // get list from collection
        let cardsService = this.dashboardManagerService.getService(collection);

        // if there is no list in collection, create one
        if (!cardsService) {
          cardsService = new CardsManagmentService();
          this.dashboardManagerService.mapService(collection, cardsService);
        }

        // subscribe to the selected collection's items
        cardsService.cards$.subscribe((cards: Card[]) => {
          cards.length
            ? (this.genericCards = of(cards))
            : (this.genericCards = undefined);
        });
      }
    );
  }

  //* Collection's methods
  openPopup() {
    this.dialog.closeAll();
    this.dialog.open(CollectionPopupComponent);
  }

  //* List's methods
  dropCard(event: CdkDragDrop<Card[]>) {
    this.dashboardManagerService.currentCardsService?.changeCardsOrder(
      event.previousIndex,
      event.currentIndex
    );
  }

  //* Input's methods
  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp':
        this.inputsManagmentService.changeInput(this.nextCardType);
        break;
      case 'ArrowDown':
        this.inputsManagmentService.changeInput(this.prevCardType);
        break;
      default:
        break;
    }
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
