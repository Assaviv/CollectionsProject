import { inject, Injectable, signal } from '@angular/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import Keycloak, { type KeycloakInitOptions } from 'keycloak-js';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { KEYCLOAK_CONFIG } from './config';

const NATIVE_REDIRECT = 'com.aviv.saveapp:/auth';
const STORAGE_KEY = 'kc';

interface StoredSession {
  token: string;
  refreshToken: string;
  idToken?: string;
}

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
    // offline_access => long-lived refresh token that survives app restarts
    const url = await this.keycloak.createLoginUrl({
      redirectUri: NATIVE_REDIRECT,
      scope: 'openid offline_access',
    });
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
    await this.clearSession();
    this.keycloak.clearToken();
    this.authenticated.set(false);
    await Browser.open({ url });
  }

  async getToken(): Promise<string | undefined> {
    if (!this.config.enabled) {
      return undefined;
    }
    try {
      await this.keycloak.updateToken(30); // fires onAuthRefreshSuccess -> persisted
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

    // Normal start: restore the saved session. init() refreshes the token right away.
    const saved = await this.loadSession();
    if (!saved) {
      return this.initWithoutSession();
    }

    try {
      const ok = await this.keycloak.init({ ...NATIVE_INIT, ...saved });
      this.authenticated.set(ok);
      return ok;
    } catch {
      // Refresh token rejected (expired/revoked) or no network.
      // init() can only run once per instance, so use a fresh client for login().
      this.keycloak = this.createClient();
      this.authenticated.set(false);
      return false;
    }
  }

  private async initWithoutSession(): Promise<boolean> {
    const ok = await this.keycloak.init(NATIVE_INIT);
    this.authenticated.set(ok);
    return ok;
  }

  private async onDeepLink(url: string): Promise<void> {
    if (!url.startsWith(NATIVE_REDIRECT)) {
      return;
    }
    Browser.close().catch(() => undefined); // closes the custom tab on iOS, no-op on Android

    // keycloak-js reads the callback from the current URL, so put it there without navigating
    const query = url.includes('?') ? url.substring(url.indexOf('?') + 1) : '';
    history.replaceState(null, '', `${window.location.pathname}?${query}`);

    // a Keycloak instance can only be initialized once, so use a fresh one.
    // Do NOT pass saved tokens here: the callback code is what we want to process.
    this.keycloak = this.createClient();
    let ok = false;
    try {
      ok = await this.keycloak.init(NATIVE_INIT); // onAuthSuccess -> tokens persisted
    } catch {
      ok = false;
    }

    this.loginInProgress = false;
    this.authenticated.set(ok);
  }

  private createClient(): Keycloak {
    const kc = new Keycloak({
      url: this.config.url,
      realm: this.config.realm,
      clientId: this.config.clientId,
    });

    if (this.native) {
      // Persist on every login and every refresh (refresh tokens can rotate)
      kc.onAuthSuccess = () => void this.saveSession(kc);
      kc.onAuthRefreshSuccess = () => void this.saveSession(kc);
    }
    return kc;
  }

  private async saveSession(kc: Keycloak): Promise<void> {
    if (!kc.token || !kc.refreshToken) {
      return;
    }
    const session: StoredSession = {
      token: kc.token,
      refreshToken: kc.refreshToken,
      idToken: kc.idToken,
    };
    try {
      await SecureStorage.set(STORAGE_KEY, session as never);
    } catch (e) {
      console.error('Failed to persist session', e);
    }
  }

  private async loadSession(): Promise<StoredSession | null> {
    try {
      const saved = (await SecureStorage.get(STORAGE_KEY)) as StoredSession | null;
      return saved?.token && saved?.refreshToken ? saved : null;
    } catch {
      return null;
    }
  }

  private async clearSession(): Promise<void> {
    try {
      await SecureStorage.remove(STORAGE_KEY);
    } catch {
      /* nothing stored */
    }
  }
}
