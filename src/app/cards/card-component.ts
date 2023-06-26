import { AfterViewInit, Component, ComponentRef, ViewChild, ViewContainerRef } from "@angular/core";
import { cardToComponentMap } from "../types";
import { CardBuilderComponent } from "./card-builder-component";

@Component({
    selector: 'collections-ui-card',
    template: "<ng-container #cardContainer></ng-container>",
}) 
export class CardComponent<T> extends CardBuilderComponent<T> implements AfterViewInit {    
    @ViewChild('cardContainer', { read: ViewContainerRef })
    childCard!: ViewContainerRef;
    cardBuilderComponent!: ComponentRef<CardBuilderComponent<unknown>>;

    ngAfterViewInit(): void {    
        const component = cardToComponentMap.get(this.cardType);
        
        if (component === undefined) return;

        this.cardBuilderComponent = this.childCard.createComponent(component);
        this.cardBuilderComponent.instance.key = this.key;
        this.cardBuilderComponent.instance.value = this.value;        
        this.cardBuilderComponent.changeDetectorRef.detectChanges();
    }

    public delete(cardId: string): void {
        console.log(cardId);
    }
}

// cardsList$!: Observable<List<Card<T>>>;