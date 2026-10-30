import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { CardType } from 'src/app/types';
import { InputBuilderComponent } from '../input-builder-component';

@Component({
  selector: 'collections-ui-key-value-input',
  templateUrl: './key-value-input.component.html',
  styleUrls: ['./key-value-input.component.scss'],
})
export class KeyValueInputComponent extends InputBuilderComponent {}
