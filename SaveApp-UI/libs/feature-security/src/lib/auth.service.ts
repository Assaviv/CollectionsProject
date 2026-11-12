import { inject, Injectable, signal } from '@angular/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import Keycloak, { type KeycloakInitOptions } from 'keycloak-js';
import { KEYCLOAK_CONFIG } from './config';

const NATIVE_REDIRECT = 'com.aviv.saveapp:/auth';

const WEB_INIT: KeycloakInitOptions = {
  onLoad: 'check-sso',
  pkceMethod: 'S256',
  checkLoginIframe: false,
};

// Capacitor exposes a Cordova shim, which makes keycloak-js pick its Cordova adapter
// and force `http://localhost` as the redirect. 'default' keeps our custom-scheme redirect.
const NATIVE_INIT: KeycloakInitOptions = {
  adapter: 'default',
  pkceMethod: 'S256',
  checkLoginIframe: false,
  responseMode: 'query',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly config = inject(KEYCLOAK_CONFIG);
  private readonly native = Capacitor.isNativePlatform();
  private keycloak = this.createClient();
  private loginInProgress = false;

  readonly authenticated = signal(false);

  get hasAccess(): boolean {
    return !this.config.enabled || this.authenticated();
  }

  get username(): string | undefined {
    if (!this.config.enabled) {
      return 'developer';
    }
    const claims = this.keycloak.tokenParsed;
    return claims?.['preferred_username'] ?? claims?.['name'];
  }

  async init(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }
    return this.native ? this.initNative() : this.initWeb();
  }

  async login(): Promise<void> {
    if (!this.native) {
      return this.keycloak.login();
    }
    if (this.loginInProgress) {
      return;
    }
    this.loginInProgress = true;
    const url = await this.keycloak.createLoginUrl({ redirectUri: NATIVE_REDIRECT });
    await Browser.open({ url });
  }

  async logout(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }
    if (!this.native) {
      return this.keycloak.logout({ redirectUri: window.location.origin });
    }
    const url = this.keycloak.createLogoutUrl({ redirectUri: NATIVE_REDIRECT });
    this.keycloak.clearToken();
    this.authenticated.set(false);
    await Browser.open({ url });
  }

  async getToken(): Promise<string | undefined> {
    if (!this.config.enabled) {
      return undefined;
    }
    try {
      await this.keycloak.updateToken(30);
    } catch {
      this.authenticated.set(false);
      return undefined;
    }
    return this.keycloak.token;
  }

  private async initWeb(): Promise<boolean> {
    const ok = await this.keycloak.init(WEB_INIT);
    this.authenticated.set(ok);
    return ok;
  }

  private async initNative(): Promise<boolean> {
    await App.addListener('appUrlOpen', ({ url }) => this.onDeepLink(url));
    await Browser.addListener('browserFinished', () => (this.loginInProgress = false));

    // The app may have been started by the deep link itself
    const launch = await App.getLaunchUrl();
    if (launch?.url?.startsWith(NATIVE_REDIRECT)) {
      await this.onDeepLink(launch.url);
      return this.authenticated();
    }

    const ok = await this.keycloak.init(NATIVE_INIT);
    this.authenticated.set(ok);
    if (!ok) {
      await this.login();
    }
    return ok;
  }

  private async onDeepLink(url: string): Promise<void> {
    if (!url.startsWith(NATIVE_REDIRECT)) {
      return;
    }

    // keycloak-js reads the callback from the current URL, so put it there without navigating
    const query = url.includes('?') ? url.substring(url.indexOf('?') + 1) : '';
    history.replaceState(null, '', `${window.location.pathname}?${query}`);

    // a Keycloak instance can only be initialized once, so use a fresh one
    this.keycloak = this.createClient();
    const ok = await this.keycloak.init(NATIVE_INIT);

    this.loginInProgress = false;
    this.authenticated.set(ok);
  }

  private createClient(): Keycloak {
    return new Keycloak({
      url: this.config.url,
      realm: this.config.realm,
      clientId: this.config.clientId,
    });
  }
}
