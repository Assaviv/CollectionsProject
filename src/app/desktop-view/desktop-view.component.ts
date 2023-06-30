import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../login/login.service';
import { FormArray } from '@angular/forms';
import { CardType } from '../types';
import { CardsManagmentService } from '../cards/cards-managment.service';
import { v4 as uuidv4 } from 'uuid';
import { Card } from '../types';
import { Observable } from 'rxjs';

@Component({
  selector: 'collections-ui-desktop-view',
  templateUrl: './desktop-view.component.html',
  styleUrls: ['./desktop-view.component.scss'],
})
export class DesktopViewComponent implements OnInit {
  // cardsFormArray: FormArray;
  genericCards!: Observable<Card[]>;

  constructor(
    private router: Router,
    private loginService: LoginService,
    private cardManagmentService: CardsManagmentService
  ) {
    // if (loginService.getUsername === undefined) {
    //   router.navigate(['/login']);
    // }
    // this.cardsFormArray = new FormArray();
  }

  ngOnInit(): void {
    this.genericCards = this.cardManagmentService.cards$;

    const cards: Card[] = [
      {
        id: uuidv4(),
        cardType: CardType.CHECKBOX,
        key: 'checkbox green or red',
        value: true,
      },
      {
        id: uuidv4(),
        key: 'Title',
        value: 'Body',
        cardType: CardType.STORY,
      },
      {
        id: uuidv4(),
        key: 'Hello world',
        value: 'lorem ipsum d   Prometheus        Lore     Ipsum Ips     ',
        cardType: CardType.SUBJECT,
      },
      {
        id: uuidv4(),
        key: 'Title',
        value:
          'Bodysasssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss',
        cardType: CardType.KEY_VALUE,
      },
      {
        id: uuidv4(),
        key: ' s s s s s s s s s s s s s s s s s s s',
        value: '.sa.ds .asd sd .asd. as,.d ,sa.d .s,d .as\n\n\nsadsdasdas',
        cardType: CardType.KEY_VALUE,
      },
      {
        id: uuidv4(),
        key: 'Title',
        value:
          'qqqqqqqqqqqqqqqqqqqqqqqq... asd d as a d qqqqqqqqqqqqqqq   q    q q q q q q q q q q q q q q q q q d dd dd dd dd  ',
        cardType: CardType.KEY_VALUE,
      },
      {
        id: uuidv4(),
        key: 'Title',
        value:
          'qqqqqqqqqqqqqqqqqqqqqqqq... asd d as a d qqqqqqqqqqqqqqq   q    q q q q q q q q q q q q q q q q q d dd dd dd dd  ',
        cardType: CardType.KEY_VALUE,
      },
      {
        id: uuidv4(),
        key: 'Title',
        value:
          'qqqqqqqqqqqqqqqqqqqqqqqq... asd d as a d qqqqqqqqqqqqqqq   q    q q q q q q q q q q q q q q q q q d dd dd dd dd  ',
        cardType: CardType.KEY_VALUE,
      },
      {
        id: uuidv4(),
        key: 'ENNDDDDDd',
        value:
          'qqqqqqqqqqqqqqqqqqqqqqqq... asd d as a d qqqqqqqqqqqqqqq   q    q q q q q q q q q q q q q q q q q d dd dd dd dd  ',
        cardType: CardType.KEY_VALUE,
      },
    ];

    cards.forEach((card: Card) => this.cardManagmentService.createCard(card));
  }
}
