import { Component, Input } from "@angular/core";
import { CardType } from "../types";

@Component({
    template: "",
})
export class CardBuilderComponent<T> {
    @Input() cardType!: CardType;
    @Input() key!: string;
    @Input() value?: T;
}
