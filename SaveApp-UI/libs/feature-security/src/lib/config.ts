import { InjectionToken } from '@angular/core';

export interface KeycloakConfig {
  enabled: boolean;
  url: string;
  realm: string;
  clientId: string;
}

export const KEYCLOAK_CONFIG = new InjectionToken<KeycloakConfig>('KEYCLOAK_CONFIG');
