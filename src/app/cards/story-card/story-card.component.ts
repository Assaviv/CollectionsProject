import { Component, Input } from '@angular/core';

@Component({
  selector: 'collections-ui-story-card',
  templateUrl: './story-card.component.html',
  styleUrls: ['./story-card.component.scss'],
})
export class StoryCardComponent {
  @Input()
  title!: string;
  @Input()
  body!: string
}
