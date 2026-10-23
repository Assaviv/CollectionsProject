import { Component, HostListener, Injector, OnInit, Type } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { CardsManagmentFactoryService } from '../cards/cards-managment-factory.service';
import { CollectionsManagmentService } from '../collection/collections-managment.service';
import { DashboardManagerService } from '../desktop-view/dashboard-manager.service';
import { FakeDataService } from '../desktop-view/fake-data.service';
import { InputBuilderComponent } from '../inputs/input-builder-component';
import { InputsManagmentService } from '../inputs/inputs-managment.service';
import { LoginService } from '../login/login.service';
import { Card, Collection, inputToComponentMap } from '../types';
import { SideBarView } from '../side-bar/side-bar.component';

@Component({
  selector: 'collections-ui-desktop-view-modern',
  templateUrl: './desktop-view-modern.component.html',
  styleUrl: './desktop-view-modern.component.scss',
})
export class DesktopViewModernComponent implements OnInit {
    activeSidePanel: SideBarView = 'collections';
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
      private cardsManagmentFactoryService: CardsManagmentFactoryService,
      private inputsManagmentService: InputsManagmentService,
      protected dashboardManagerService: DashboardManagerService,
      private collectionsManagmentService: CollectionsManagmentService,
    ) {}

  ngOnInit(): void {
    this.dashboardManagerService.setBgcolor = 'modern-bg';
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
        150,
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
    this.genericCollections = this.collectionsManagmentService.items$;
  }

  setSidePanel(view: SideBarView): void {
    this.activeSidePanel = view;
  }

  // TODO: Need to understand how to get rid of those functions
  private setupList(): void {
    this.genericCards = undefined;

    // Setup main list stream
    // cards$ getting updates after createCard is called, recursion.
    this.cardsManagmentFactoryService
      .create('demo')
      .cards$.subscribe((cards) => {
        const card = cards.pop();

        if (card) {
          this.dashboardManagerService.currentCardsService?.createCard(card);
        }
      });

    this.collectionsManagmentService.selectedCollection.subscribe(
      (collection) => {
        if (collection) {
          this.onSelectedCollection(collection);
        } else {
          this.genericCards = undefined;
        }
      },
    );
  }

  // Move logic to the collection service as a composition
  private onSelectedCollection = (collection: Collection) => {
    // get list from collection
    let cardsService = this.dashboardManagerService.getService(collection.id);

    // if there is no list in collection, create one
    if (!cardsService) {
      cardsService = this.cardsManagmentFactoryService.create(collection.id);
      this.dashboardManagerService.mapService(collection.id, cardsService);
    }

    // subscribe to the selected collection's items
    cardsService.cards$.subscribe((cards: Card[]) => {
      cards.length
        ? (this.genericCards = of(cards))
        : (this.genericCards = undefined);
    });
  };

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
