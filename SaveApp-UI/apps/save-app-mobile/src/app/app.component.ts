import { Component } from '@angular/core';
import { MobileViewModernComponent } from './mobile-view-modern/mobile-view-modern.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MobileViewModernComponent],
  template: '<save-app-mobile-view-modern />',
  styles: [':host { display: block; min-height: 100dvh; }'],
})
export class AppComponent {
  title = 'save-app-mobile';
}
