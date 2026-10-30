import { Component, Input } from '@angular/core';

@Component({
  selector: 'collections-ui-emoji-box',
  templateUrl: './emoji-box.component.html',
  styleUrls: ['./emoji-box.component.scss'],
})
export class EmojiBoxComponent {
  @Input() emoji!: string;
}
