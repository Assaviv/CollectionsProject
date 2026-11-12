import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { appRoutes } from './app.routes';
import { CardCreator, SelectedCollectionCardCreator } from '@save-app/feature-inputs';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideDataAccess } from '@save-app/data-access';
import { environment } from '../environments/environments';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { authInterceptor, AuthService, KEYCLOAK_CONFIG } from '@save-app/feature-security';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes, withEnabledBlockingInitialNavigation()),
    {
      provide: KEYCLOAK_CONFIG,
      useValue: environment.auth,
    },
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService) => () => authService.init(),
      deps: [AuthService],
      multi: true,
    },
    provideHttpClient(withInterceptors([authInterceptor])),
    provideDataAccess({ apiBaseUrl: environment.apiBaseUrl }),
    { provide: CardCreator, useExisting: SelectedCollectionCardCreator },
  ],
};
