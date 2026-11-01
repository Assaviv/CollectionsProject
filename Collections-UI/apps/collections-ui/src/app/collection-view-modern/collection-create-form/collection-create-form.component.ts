import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CollectionsFacade } from '@save-app/data-access';
import { CollectionSelection } from '@save-app/feature-collections';

@Component({
  selector: 'collections-ui-collection-create-form',
  templateUrl: './collection-create-form.component.html',
  styleUrl: './collection-create-form.component.scss',
})
export class CollectionCreateFormComponent {
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();
  
  private readonly facade = inject(CollectionsFacade);
  private readonly selection = inject(CollectionSelection);
  collectionForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
  ) {
    this.collectionForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.maxLength(32)]],
      description: ['', [Validators.required, Validators.maxLength(128)]],
    });
  }

  async createCollection(): Promise<void> {
    if (this.collectionForm.invalid) {
      this.collectionForm.markAllAsTouched();
      return;
    }

    const { title, description } = this.collectionForm.getRawValue();
    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();

    if (!normalizedTitle || !normalizedDescription) {
      this.collectionForm.markAllAsTouched();
      return;
    }

    const id = await this.facade.insertCollection({
      title: normalizedTitle,
      description: normalizedDescription,
      emoji: '📁',
    });

    this.selection.select(id);

    this.created.emit();
  }
}
