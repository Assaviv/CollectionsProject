import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { CardCreator, SelectedCollectionCardCreator } from '@save-app/feature-inputs';
import { DATA_ACCESS_CONFIG, provideDataAccess } from '@save-app/data-access';
import { authInterceptor, AuthService, KEYCLOAK_CONFIG } from '@save-app/feature-security';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
    {
      provide: KEYCLOAK_CONFIG,
      useValue: environment.auth,
    },
    { provide: CardCreator, useExisting: SelectedCollectionCardCreator },
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService) => () => authService.init(),
      deps: [AuthService],
      multi: true,
    },
    provideHttpClient(withInterceptors([authInterceptor])),
    provideDataAccess({ apiBaseUrl: environment.apiBaseUrl }),
    {
      provide: DATA_ACCESS_CONFIG,
      useFactory: (authService: AuthService) => ({
        apiBaseUrl: environment.apiBaseUrl,
        canSync: () => authService.hasAccess,
      }),
      deps: [AuthService],
    },
  ],
};
