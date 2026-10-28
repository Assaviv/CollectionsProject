import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CollectionType } from '../../../types';
import { CollectionsManagmentService } from '../../../collection/collections-managment.service';

@Component({
  selector: 'collections-ui-collection-create-form',
  templateUrl: './collection-create-form.component.html',
  styleUrl: './collection-create-form.component.scss',
})
export class CollectionCreateFormComponent {
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  collectionForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private collectionsManagementService: CollectionsManagmentService,
  ) {
    this.collectionForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.maxLength(32)]],
      description: ['', [Validators.required, Validators.maxLength(128)]],
    });
  }

  createCollection(): void {
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

    this.collectionsManagementService.addItem({
      title: normalizedTitle,
      description: normalizedDescription,
      emoji: '📁',
      collectionType: CollectionType.ANY,
      backgroundColor: '#FFFFFF',
    });
    this.created.emit();
  }
}
