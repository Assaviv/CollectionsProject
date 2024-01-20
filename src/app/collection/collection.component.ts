import { Component, Input, OnInit } from '@angular/core';
import { Collection, CollectionType, Visibility } from '../types';
import { CollectionsManagmentService } from './collections-managment.service';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

@Component({
  selector: 'collections-ui-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss'],
  animations: [
    trigger('cardAnimation', [
      state(
        'visible',
        style({
          opacity: 1,
          transform: 'scale(1)',
        })
      ),
      state(
        'hidden',
        style({
          opacity: 0,
          transform: 'scale(0)',
        })
      ),
      transition('hidden => visible', [animate('0.3s ease-in')]),
      transition('visible => hidden', [animate('0.3s ease-out')]),
    ]),
  ],
})
export class CollectionComponent implements Collection, OnInit {
  @Input() id!: string;
  @Input() title!: string;
  @Input() description!: string;
  @Input() emoji!: string;
  @Input() collectionType!: CollectionType;
  @Input() backgroundColor!: string | undefined;
  cardState: Visibility = 'hidden';

  constructor(private collectionManagment: CollectionsManagmentService) {}
  ngOnInit(): void {
    if (this.id === 'demo') {
      this.cardState = 'visible';
    }
    setTimeout(() => {
      this.cardState = 'visible';
    }, 0);
  }

  delete(): void {
    if (this.id !== 'demo') {
      this.cardState = 'hidden';
      setTimeout(() => this.collectionManagment.deleteItem(this.id), 300);
    }
  }

  openCollection() {
    if (this.id === 'demo') {
      return;
    }

    this.collectionManagment.changeSelection = this;
  }
}
