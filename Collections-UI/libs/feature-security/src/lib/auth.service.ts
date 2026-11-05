import { inject, Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { KEYCLOAK_CONFIG } from './config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly config = inject(KEYCLOAK_CONFIG);

  private readonly keycloak = new Keycloak({
    url: this.config.keycloakUrl,
    realm: this.config.realm,
    clientId: this.config.clientId,
  });

  init(): Promise<boolean> {
    return this.keycloak.init({
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });
  }

  async getToken(): Promise<string | undefined> {
    try {
      await this.keycloak.updateToken(30);
    } catch {
      await this.keycloak.login();
    }
    return this.keycloak.token;
  }

  logout() {
    return this.keycloak.logout({ redirectUri: window.location.origin });
  }
}
