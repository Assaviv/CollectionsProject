import {
  AfterViewInit,
  Component,
  ComponentRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { cardToComponentMap } from '../types';
import { CardBuilderComponent } from './card-builder-component';

@Component({
  selector: 'collections-ui-card',
  template: '<ng-container #cardContainer></ng-container>',
})
export class CardComponent
  extends CardBuilderComponent
  implements AfterViewInit
{
  @ViewChild('cardContainer', { read: ViewContainerRef })
  childCard!: ViewContainerRef;
  cardBuilderComponent!: ComponentRef<CardBuilderComponent>;

  ngAfterViewInit(): void {
    const component = cardToComponentMap.get(this.cardType);

    if (component === undefined) return;

    this.cardBuilderComponent = this.childCard.createComponent(component);
    this.cardBuilderComponent.instance.key = this.key;
    this.cardBuilderComponent.instance.value = this.value;
    this.cardBuilderComponent.instance.id = this.id;
    this.cardBuilderComponent.instance.cardType = this.cardType;
    this.cardBuilderComponent.changeDetectorRef.detectChanges();
  }
}
