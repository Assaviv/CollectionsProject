import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CollectionsFacade } from '@save-app/data-access';
import { CollectionSelection } from '@save-app/feature-collections';

@Component({
  selector: 'save-app-mobile-collection-create-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './mobile-collection-create-form.component.html',
  styleUrl: './mobile-collection-create-form.component.scss',
})
export class MobileCollectionCreateFormComponent {
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();
  private readonly facade = inject(CollectionsFacade);
  private readonly selection = inject(CollectionSelection);
  private readonly formBuilder = inject(FormBuilder);

  readonly emojiOptions = ['📁', '😂', '🎉', '❤️', '📸'] as const;;

  readonly collectionForm = this.formBuilder.group({
    emoji: [this.emojiOptions[0] as string, [Validators.required]],
    title: ['', [Validators.required, Validators.maxLength(32)]],
    description: ['', [Validators.required, Validators.maxLength(128)]],
  });

  async createCollection(): Promise<void> {
    if (this.collectionForm.invalid) {
      this.collectionForm.markAllAsTouched();
      return;
    }
    const { title, description, emoji } = this.collectionForm.getRawValue();
    const normalizedTitle = title?.trim() ?? '';
    const normalizedDescription = description?.trim() ?? '';
    if (!normalizedTitle || !normalizedDescription) {
      this.collectionForm.markAllAsTouched();
      return;
    }
    const id = await this.facade.insertCollection({
      title: normalizedTitle,
      description: normalizedDescription,
      emoji: emoji || this.emojiOptions[0],
    });
    this.selection.select(id);
    this.created.emit();
  }
}
