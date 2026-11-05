import { InjectionToken } from '@angular/core';

export interface KeycloakConfig {
  keycloakUrl: string;
  realm: string;
  clientId: string;
}

export const KEYCLOAK_CONFIG = new InjectionToken<KeycloakConfig>('DATA_ACCESS_CONFIG');
