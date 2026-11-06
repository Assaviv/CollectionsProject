import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { bgcolor } from '@save-app/models';
import { ThemeService } from '@save-app/ui';
import { AuthService } from '@save-app/feature-security';

@Component({
  selector: 'collections-ui-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly theme = inject(ThemeService);
  
  themesOpen = false;

  get username(): string | undefined {
    return this.authService.username;
  }

  logout(): void {
    void this.authService.logout();
  }

  click(color: bgcolor) {
    this.theme.setBgcolor = color;
    this.themesOpen = false;
  }

  toggleThemes(): void {
    this.themesOpen = !this.themesOpen;
  }
}
