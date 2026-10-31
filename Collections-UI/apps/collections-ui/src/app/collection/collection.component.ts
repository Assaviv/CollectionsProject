import { Component, Input, OnInit } from '@angular/core';
import { CollectionsManagmentService } from './collections-managment.service';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Collection, Visibility } from '@save-app/models';

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
        }),
      ),
      state(
        'hidden',
        style({
          opacity: 0,
          transform: 'scale(0)',
        }),
      ),
      transition('hidden => visible', [animate('0.3s ease-in')]),
      transition('visible => hidden', [animate('0.3s ease-out')]),
    ]),
  ],
})
export class CollectionComponent implements OnInit {
  @Input() collection!: Collection;
  cardState: Visibility = 'hidden';

  constructor(private collectionManagment: CollectionsManagmentService) {}

  ngOnInit(): void {
    if (this.collection.id === 'demo') {
      this.cardState = 'visible';
    }
    setTimeout(() => {
      this.cardState = 'visible';
    }, 0);
  }

  delete(): void {
    if (this.collection.id !== 'demo') {
      this.cardState = 'hidden';
      setTimeout(
        () => this.collectionManagment.deleteItem(this.collection.id),
        300,
      );
    }
  }

  openCollection() {
    if (this.collection.id === 'demo') {
      return;
    }

    this.collectionManagment.changeSelection = this.collection;
  }
}
