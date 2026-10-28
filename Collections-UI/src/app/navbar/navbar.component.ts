import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LoginService } from '../login/login.service';
import { DashboardManagerService } from '../desktop-view-modern/dashboard-manager.service';
import { bgcolor } from '../types';

@Component({
  selector: 'collections-ui-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  username$!: BehaviorSubject<string>;
  themesOpen = false;

  constructor(
    private loginService: LoginService,
    private dashboardManagerService: DashboardManagerService
  ) {
    this.username$ = new BehaviorSubject<string>('Guest');
  }

  ngOnInit(): void {
    this.loginService.getUsername$.subscribe(
      (username: string) => this.username$.next(username ?? 'Guest') // ?? 'Guest' is temporary until login page is back
    );
  }

  click(color: bgcolor) {
    this.dashboardManagerService.setBgcolor = color;
    this.themesOpen = false;
  }

  toggleThemes(): void {
    this.themesOpen = !this.themesOpen;
  }
}
