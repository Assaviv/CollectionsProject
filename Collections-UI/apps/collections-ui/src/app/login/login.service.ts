import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { of } from 'rxjs/internal/observable/of';
import { KeyValue } from '@save-app/models';
import { CACHE_DATABASE, Database } from '@save-app/data-access';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private username!: string;

  constructor(@Inject(CACHE_DATABASE) private database: Database<KeyValue>) {}

  public get getUsername(): string {
    return this.username;
  }

  public get getUsername$(): Observable<string> {
    return of(this.username);
  }

  private isUserExist(username: string): boolean {
    return this.database.has(username);
  }

  public addUser(username: string, password: string): string | null {
    if (this.isUserExist(username)) return 'User already exists';
    username = username.trim();
    this.username = username;
    this.database.insert({ key: username, value: password });

    return null;
  }

  public validate(username: string, password: string): boolean {
    return this.database.find(username) === password;
  }
}
