import { Component, OnInit, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CollectionsManagmentService } from '../../collection/collections-managment.service';
import { CollectionType } from '../../types';
import { MatDialogRef } from '@angular/material/dialog';
import { Emoji, EmojiEvent } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatChipInputEvent, MatChipEditedEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

@Component({
  selector: 'collections-ui-collection-popup',
  templateUrl: './collection-popup.component.html',
  styleUrls: ['./collection-popup.component.scss'],
})
export class CollectionPopupComponent implements OnInit {
  collectionForm!: FormGroup;
  readonly MAX_TITLE_LENGTH = 32;
  readonly MAX_DESCRIPTION_LENGTH = 128;
  showEmojiPicker = false;
  chosenEmoji!: string | Emoji | undefined;
  formatDegreesLabel = (degree: number) => `${degree}°`;
  formatSizeLabel = (size: number) => `${size}px`;
  backgroundColor = '#FFFFFF';

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CollectionPopupComponent>,
    private collectionsManagmentService: CollectionsManagmentService,
  ) {}

  ngOnInit(): void {
    this.collectionForm = this.fb.group({
      title: [
        '',
        [Validators.required, Validators.maxLength(this.MAX_TITLE_LENGTH)],
      ],
      description: [
        '',
        [
          Validators.required,
          Validators.maxLength(this.MAX_DESCRIPTION_LENGTH),
        ],
      ],
    });
  }

  submitForm(): void {
    if (this.collectionForm.valid) {
      this.collectionsManagmentService.addItem({
        collectionType: CollectionType.ANY,
        title: this.title,
        description: this.description,
        emoji: this.chosenEmoji?.toString() ?? '',
        backgroundColor: this.backgroundColor,
      });

      alert(`Successfully create ${this.title}\nClose and exit.`);
      this.dialogRef.close();
    }
  }

  showPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  emojiClicked(selected: EmojiEvent): void {
    this.chosenEmoji = selected.emoji.native ?? '';
  }

  setColor(color: string) {
    this.backgroundColor = color;
  }

  getControlsValue(controlName: string, defaultValue: string): string {
    const value = this.collectionForm.get(controlName)?.value.trim();

    return value == '' ? defaultValue : value;
  }

  get title(): string {
    return this.getControlsValue('title', 'The Collection Title Here!');
  }

  get description(): string {
    return this.getControlsValue(
      'description',
      `Here you will describe what this collection will contain and configured to do.`,
    );
  }

  get emoji(): string {
    return this.chosenEmoji?.toString() ?? '';
  }

  //* Functions for tags

  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  tags: string[] = ['Lemon', 'Lime', 'Apple'];

  announcer = inject(LiveAnnouncer);

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our fruit
    if (value) {
      this.tags.push(value);
    }

    // Clear the input value
    event.chipInput?.clear();
  }

  remove(fruit: string): void {
    const index = this.tags.indexOf(fruit);

    if (index >= 0) {
      this.tags.splice(index, 1);

      this.announcer.announce(`Removed ${fruit}`);
    }
  }

  edit(fruit: string, event: MatChipEditedEvent) {
    const value = event.value.trim();

    // Remove fruit if it no longer has a name
    if (!value) {
      this.remove(fruit);
      return;
    }

    // Edit existing fruit
    const index = this.tags.indexOf(fruit);
    if (index >= 0) {
      this.tags[index] = value;
    }
  }
}
