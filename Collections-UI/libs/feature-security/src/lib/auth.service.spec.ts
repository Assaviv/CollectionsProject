import { TestBed } from '@angular/core/testing';
import Keycloak from 'keycloak-js';
import { AuthService } from './auth.service';
import { KEYCLOAK_CONFIG, KeycloakConfig } from './config';

describe('AuthService', () => {
  let service: AuthService;
  const config: KeycloakConfig = {
    enabled: true,
    url: 'https://identity.example.test',
    realm: 'collections',
    clientId: 'collections-ui',
  };

  function createService(overrides: Partial<KeycloakConfig> = {}) {
    TestBed.configureTestingModule({
      providers: [{ provide: KEYCLOAK_CONFIG, useValue: { ...config, ...overrides } }],
    });
    service = TestBed.inject(AuthService);
  }

  afterEach(() => {
    jest.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('initializes Keycloak with login required and PKCE when enabled', async () => {
    const init = jest.spyOn(Keycloak.prototype, 'init').mockResolvedValue(true);
    createService();

    await expect(service.init()).resolves.toBe(true);
    expect(init).toHaveBeenCalledWith({
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });
  });

  it('skips Keycloak initialization when disabled', async () => {
    const init = jest.spyOn(Keycloak.prototype, 'init');
    createService({ enabled: false });

    await expect(service.init()).resolves.toBe(false);
    expect(init).not.toHaveBeenCalled();
  });

  it('refreshes the token and returns it', async () => {
    const updateToken = jest.spyOn(Keycloak.prototype, 'updateToken').mockResolvedValue(true);
    createService();
    (service as unknown as { keycloak: Keycloak }).keycloak.token = 'access-token';

    await expect(service.getToken()).resolves.toBe('access-token');
    expect(updateToken).toHaveBeenCalledWith(30);
  });

  it('starts login when token refresh fails, then returns the current token', async () => {
    const updateToken = jest.spyOn(Keycloak.prototype, 'updateToken').mockRejectedValue(new Error('expired'));
    const login = jest.spyOn(Keycloak.prototype, 'login').mockResolvedValue(undefined);
    createService();
    (service as unknown as { keycloak: Keycloak }).keycloak.token = 'new-token';

    await expect(service.getToken()).resolves.toBe('new-token');
    expect(updateToken).toHaveBeenCalledWith(30);
    expect(login).toHaveBeenCalled();
  });

  it('uses developer identity and avoids Keycloak calls when disabled', async () => {
    const updateToken = jest.spyOn(Keycloak.prototype, 'updateToken');
    const logout = jest.spyOn(Keycloak.prototype, 'logout');
    createService({ enabled: false });

    expect(service.username).toBe('developer');
    await expect(service.getToken()).resolves.toBeUndefined();
    await expect(service.logout()).resolves.toBeUndefined();
    expect(updateToken).not.toHaveBeenCalled();
    expect(logout).not.toHaveBeenCalled();
  });

  it('reads username from preferred_username, falling back to name', () => {
    createService();
    const keycloak = (service as unknown as { keycloak: Keycloak }).keycloak;
    keycloak.tokenParsed = { preferred_username: 'preferred', name: 'display' };
    expect(service.username).toBe('preferred');
    keycloak.tokenParsed = { name: 'display' };
    expect(service.username).toBe('display');
  });

  it('logs out to the current origin', async () => {
    const logout = jest.spyOn(Keycloak.prototype, 'logout').mockResolvedValue(undefined);
    createService();

    await service.logout();
    expect(logout).toHaveBeenCalledWith({ redirectUri: window.location.origin });
  });
});
