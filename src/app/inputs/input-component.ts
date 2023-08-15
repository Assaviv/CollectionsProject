import {
  AfterViewInit,
  Component,
  ComponentRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { inputToComponentMap } from '../types';
import { InputBuilderComponent } from './input-builder-component';

@Component({
  selector: 'collections-ui-input',
  template: '<ng-container #inputContainer></ng-container>',
})
export class InputComponent
  extends InputBuilderComponent
  implements AfterViewInit
{
  @ViewChild('inputContainer', { read: ViewContainerRef })
  childInput!: ViewContainerRef;
  inputBuilderComponent!: ComponentRef<InputBuilderComponent>;

  ngAfterViewInit(): void {
    throw new Error('DEPRECATED');
    // const component = inputToComponentMap.get(this.cardType$);

    // if (component === undefined) return;

    // this.inputBuilderComponent = this.childInput.createComponent(component);
    // this.inputBuilderComponent.instance.key = this.key;
    // this.inputBuilderComponent.instance.value = this.value;
    // this.inputBuilderComponent.instance.cardType$ = this.cardType$;
    // this.inputBuilderComponent.changeDetectorRef.detectChanges();
  }
}
