import { Component } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { InputBuilderComponent } from '../../input/input-builder-component';

@Component({
  selector: 'save-app-link-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './link-input.component.html',
  styleUrls: ['./link-input.component.scss'],
})
export class LinkInputComponent extends InputBuilderComponent {
  protected override valueValidators(): ValidatorFn[] {
    return [Validators.required, this.urlValidator];
  }

  protected override normalizeValue(value: string): string {
    return value.startsWith('http') ? value : 'https://' + value;
  }

  urlValidator(control: AbstractControl): ValidationErrors | null {
    const value = String(control.value ?? '').trim();
    if (!value) return null; // `required` handles empty
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
      return url.hostname.includes('.') ? null : { url: true };
    } catch {
      return { url: true };
    }
  }
}
