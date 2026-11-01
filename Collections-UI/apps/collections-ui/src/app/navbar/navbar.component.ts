import { Component, inject, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LoginService } from '../login/login.service';
import { bgcolor } from '../types';
import { ThemeService } from '@save-app/ui';

@Component({
  selector: 'collections-ui-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  private readonly theme = inject(ThemeService);
  
  username$!: BehaviorSubject<string>;
  themesOpen = false;

  constructor(
    private loginService: LoginService,
  ) {
    this.username$ = new BehaviorSubject<string>('Guest');
  }

  ngOnInit(): void {
    this.loginService.getUsername$.subscribe(
      (username: string) => this.username$.next(username ?? 'Guest') // ?? 'Guest' is temporary until login page is back
    );
  }

  click(color: bgcolor) {
    this.theme.setBgcolor = color;
    this.themesOpen = false;
  }

  toggleThemes(): void {
    this.themesOpen = !this.themesOpen;
  }
}
