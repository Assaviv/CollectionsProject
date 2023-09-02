import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CollectionsManagmentService } from '../collection/collections-managment.service';
import { CollectionType } from '../types';
import { MatDialogRef } from '@angular/material/dialog';
import { Emoji, EmojiEvent } from '@ctrl/ngx-emoji-mart/ngx-emoji';

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
  chosenEmoji!: string | Emoji;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CollectionPopupComponent>,
    private collectionsManagmentService: CollectionsManagmentService
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
        emoji: this.chosenEmoji.toString(),
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
      `Here you will describe what this collection will contain and configured to do.`
    );
  }

  get emoji(): string {
    return this.chosenEmoji?.toString() ?? '';
  }
}
