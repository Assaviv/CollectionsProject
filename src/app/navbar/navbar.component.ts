import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LoginService } from '../login/login.service';

@Component({
  selector: 'collections-ui-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  username$!: BehaviorSubject<string>;

  constructor(private loginService: LoginService) {
    this.username$ = new BehaviorSubject<string>('Guest');
  }

  ngOnInit(): void {
    this.loginService.getUsername$.subscribe(
      (username: string) => this.username$.next(username ?? 'Guest') // ?? 'Guest' is temporary until login page is back
    );
  }
}
