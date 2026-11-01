import { Injectable, signal } from '@angular/core';
import { bgcolor } from '@save-app/models';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  bgcolor = signal<bgcolor>('modern-bg');
  
  set setBgcolor(color: bgcolor) {
    this.bgcolor.set(color);
  }
}