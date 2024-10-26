import { Component, HostListener, Injector, OnInit, Type } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../login/login.service';
import { Collection, DEFUALT_COLLECTION, inputToComponentMap } from '../types';
import { CardsManagmentService } from '../cards/cards-managment.service';
import { Card } from '../types';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { InputBuilderComponent } from '../inputs/input-builder-component';
import { CollectionsManagmentService } from '../collection/collections-managment.service';
import { InputsManagmentService } from '../inputs/inputs-managment.service';
import { MatDialog } from '@angular/material/dialog';
import { CollectionPopupComponent } from '../collection-popup/collection-popup.component';
import { FakeDataService } from './fake-data.service';
import { DashboardManagerService } from './dashboard-manager.service';
import { MongoDB } from '../database/monogodb';

@Component({
  selector: 'collections-ui-desktop-view',
  templateUrl: './desktop-view.component.html',
  styleUrls: ['./desktop-view.component.scss'],
})
export class DesktopViewComponent implements OnInit {
  genericCards!: Observable<Card[]> | undefined;
  genericCollections!: Observable<Collection[]>;

  dynamicComponentInjector!: Injector;
  inputComponent!: Type<InputBuilderComponent> | null;
  animationSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private injector: Injector,
    private router: Router,
    private loginService: LoginService,
    private dialog: MatDialog,
    private fakeDataService: FakeDataService,
    private cardManagmentService: CardsManagmentService,
    private inputsManagmentService: InputsManagmentService,
    protected dashboardManagerService: DashboardManagerService,
    private collectionsManagmentService: CollectionsManagmentService,
    private database: MongoDB,
  ) {}

  ngOnInit(): void {
    this.fakeDataService.createFakeData();
    this.setupInput();
    this.setupCollections();
    this.setupList();

    // if (loginService.getUsername === undefined) {
    //   router.navigate(['/login']);
    // }
  }

  private setupInput(): void {
    this.inputsManagmentService.inputType$.subscribe((inputType) => {
      this.animationSubject.next(true);

      setTimeout(
        () =>
          (this.inputComponent = inputToComponentMap.get(inputType) ?? null),
        300,
      );

      this.animationSubject.next(false);
    });

    this.dynamicComponentInjector = Injector.create({
      providers: [
        {
          provide: 'cardType',
          useValue: this.inputsManagmentService.inputType$,
        },
        {
          provide: 'animationObserver',
          useValue: this.animationSubject,
        },
      ],
      parent: this.injector,
    });
  }

  private setupCollections(): void {
    // Setup show collections
    if (this.collectionsManagmentService.subject.getValue.length === 0) {
      this.collectionsManagmentService.addItem(DEFUALT_COLLECTION);
      this.collectionsManagmentService.changeSelection =
        this.collectionsManagmentService.subject.getValue()[0];
    }

    this.genericCollections = this.collectionsManagmentService.items$;
  }

  // TODO: Need to understand how to get rid of those functions
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
      this.onSelectedCollection,
    );
  }

  // Move logic to the collection service as a composition
  private onSelectedCollection = (collection: Collection) => {
    // get list from collection
    let cardsService = this.dashboardManagerService.getService(collection.id);

    // if there is no list in collection, create one
    if (!cardsService) {
      cardsService = new CardsManagmentService(this.database);
      this.dashboardManagerService.mapService(collection.id, cardsService);
    }

    // subscribe to the selected collection's items
    cardsService.cards$.subscribe((cards: Card[]) => {
      cards.length
        ? (this.genericCards = of(cards))
        : (this.genericCards = undefined);
    });
  };

  //* Collection's methods
  openPopup() {
    this.dialog.closeAll();
    this.dialog.open(CollectionPopupComponent);
  }

  //* Input's methods
  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp':
        this.inputsManagmentService.changeToNextInput();
        break;
      case 'ArrowDown':
        this.inputsManagmentService.changeToPreviousInput();
        break;
      default:
        break;
    }
  }
}
