import { Component, HostListener, Injector, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../login/login.service';
import { FormArray } from '@angular/forms';
import { CardType, inputToComponentMap } from '../types';
import { CardsManagmentService } from '../cards/cards-managment.service';
import { Card } from '../types';
import { Observable } from 'rxjs';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { InputBuilderComponent } from '../inputs/input-builder-component';

@Component({
  selector: 'collections-ui-desktop-view',
  templateUrl: './desktop-view.component.html',
  styleUrls: ['./desktop-view.component.scss'],
})
export class DesktopViewComponent implements OnInit {
  // cardsFormArray: FormArray;
  genericCards!: Observable<Card[]>;
  cardTypes = [CardType.SUBJECT, CardType.STORY, CardType.KEY_VALUE]; // temp until all resolved then use inputToComp...
  cardTypeIndex = 0;
  dynamicComponentInjector: Injector;
  inputComponent!: typeof InputBuilderComponent | null;

  constructor(
    private injector: Injector,
    private router: Router,
    private loginService: LoginService,
    private cardManagmentService: CardsManagmentService
  ) {
    this.cardManagmentService.inputType$.subscribe((inputType) => {
      this.inputComponent = inputToComponentMap.get(inputType) ?? null;
    });
    this.dynamicComponentInjector = Injector.create({
      providers: [
        { provide: 'cardType', useValue: cardManagmentService.inputType$ },
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
      {
        key: 'Image',
        value:
          'https://i.pinimg.com/736x/a2/e5/3a/a2e53a125f14c946cada10acf5db59cb--roller-coasters-rollers.jpg',
        cardType: CardType.IMAGE,
      },
    ];

    cards.forEach((card: Omit<Card, 'id'>) =>
      this.cardManagmentService.createCard(card)
    );
  }

  drop(event: CdkDragDrop<Card[]>) {
    this.cardManagmentService.changeCardsOrder(
      event.previousIndex,
      event.currentIndex
    );
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        this.cardManagmentService.changeInput(this.nextCardType);
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        this.cardManagmentService.changeInput(this.prevCardType);
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
