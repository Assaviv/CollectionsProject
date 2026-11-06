import { InjectionToken } from '@angular/core';

export interface KeycloakConfig {
  isSecure: boolean;
  keycloakUrl: string;
  realm: string;
  clientId: string;
}

export const KEYCLOAK_CONFIG = new InjectionToken<KeycloakConfig>('KEYCLOAK_CONFIG');
