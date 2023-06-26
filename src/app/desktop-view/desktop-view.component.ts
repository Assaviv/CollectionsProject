import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../login/login.service';
import { FormArray } from '@angular/forms';
import { CardType } from '../types';

@Component({
  selector: 'collections-ui-desktop-view',
  templateUrl: './desktop-view.component.html',
  styleUrls: ['./desktop-view.component.scss'],
})
export class DesktopViewComponent {
  genericCards: {title: string, body: string, cardType: CardType}[] = [
    {
      title: 'Title',
      body: 'Body',
      cardType: CardType.KEY_VALUE
    },
    {
      title: 'Hello world',
      body: 'lorem ipsum d   Prometheus        Lore     Ipsum Ips     ',
      cardType: CardType.KEY_VALUE
    },
    {
      title: 'Title',
      body: 'Bodysasssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss',
      cardType: CardType.KEY_VALUE
    },
    {
      title: ' s s s s s s s s s s s s s s s s s s s',
      body: '.sa.ds .asd sd .asd. as,.d ,sa.d .s,d .as\n\n\nsadsdasdas',
      cardType: CardType.KEY_VALUE
    },
    {
      title: 'Title',
      body: 'qqqqqqqqqqqqqqqqqqqqqqqq... asd d as a d qqqqqqqqqqqqqqq   q    q q q q q q q q q q q q q q q q q d dd dd dd dd  ',
      cardType: CardType.KEY_VALUE
    },
    {
      title: 'Title',
      body: 'qqqqqqqqqqqqqqqqqqqqqqqq... asd d as a d qqqqqqqqqqqqqqq   q    q q q q q q q q q q q q q q q q q d dd dd dd dd  ',
      cardType: CardType.KEY_VALUE
    },
    {
      title: 'Title',
      body: 'qqqqqqqqqqqqqqqqqqqqqqqq... asd d as a d qqqqqqqqqqqqqqq   q    q q q q q q q q q q q q q q q q q d dd dd dd dd  ',
      cardType: CardType.KEY_VALUE
    },
    {
      title: 'ENNDDDDDd',
      body: 'qqqqqqqqqqqqqqqqqqqqqqqq... asd d as a d qqqqqqqqqqqqqqq   q    q q q q q q q q q q q q q q q q q d dd dd dd dd  ',
      cardType: CardType.KEY_VALUE
    },
  ];
  // cardsFormArray: FormArray;

  constructor (private router: Router, private loginService: LoginService) {
    // if (loginService.getUsername === undefined) {
    //   router.navigate(['/login']);
    // }

    // this.cardsFormArray = new FormArray();
  }
}
