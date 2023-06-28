import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private db!: Map<string, string>;
  private username!: string;

  constructor() {
    this.db = new Map<string, string>();
  }

  public get getUsername(): string {
    return this.username;
  }

  private isUserExist(username: string): boolean {
    return this.db.has(username);
  }

  public addUser(username: string, password: string): string | null {
    if (this.isUserExist(username)) return 'User already exists';
    username = username.trim();
    this.username = username;
    this.db.set(username, password);

    return null;
  }

  public validate(username: string, password: string): boolean {
    return this.db.get(username) === password;
  }
}
