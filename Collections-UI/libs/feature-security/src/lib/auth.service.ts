import { inject, Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { KEYCLOAK_CONFIG } from './config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly config = inject(KEYCLOAK_CONFIG);

  private readonly keycloak = new Keycloak({
    url: this.config.url,
    realm: this.config.realm,
    clientId: this.config.clientId,
  });

  init(): Promise<boolean> {
    if (!this.config.enabled) {
      return Promise.resolve(false);
    }

    return this.keycloak.init({
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });
  }

  async getToken(): Promise<string | undefined> {
    if (!this.config.enabled) {
      return undefined;
    }

    try {
      await this.keycloak.updateToken(30);
    } catch {
      await this.keycloak.login();
    }
    return this.keycloak.token;
  }

  get username(): string | undefined {
    if (!this.config.enabled) {
      return 'developer';
    }

    const claims = this.keycloak.tokenParsed;
    return claims?.['preferred_username'] ?? claims?.['name'];
  }

  logout(): Promise<void> {
    if (!this.config.enabled) {
      return Promise.resolve();
    }

    return this.keycloak.logout({ redirectUri: window.location.origin });
  }
}

// TODO: --- Fix CODEX ---
// Make all of the URL configuration and environments pass through a central place
// Build the Spring cloud gateway (Learn why webflux and why something else)
// Start system under isSsoOn 
