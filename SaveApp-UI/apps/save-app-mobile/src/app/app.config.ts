import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { appRoutes } from './app.routes';
import { CardCreator, SelectedCollectionCardCreator } from '@save-app/feature-inputs';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { DATA_ACCESS_CONFIG, provideDataAccess } from '@save-app/data-access';
import { environment } from '../environments/environments';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { authInterceptor, AuthService, KEYCLOAK_CONFIG } from '@save-app/feature-security';
import { ShareInboxService } from './share/share-inbox.service';
import { SyncOnLoginService } from './sync/sync-on-login.service';

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
      // Import shared items only after sign-in is restored; otherwise the sync that follows
      // each insert is skipped (canSync() is still false) and the card waits for the next poll.
      useFactory: (authService: AuthService, shareInbox: ShareInboxService, syncOnLogin: SyncOnLoginService) => async () => {
        await authService.init();
        shareInbox.start();
        syncOnLogin.start();
      },
      deps: [AuthService, ShareInboxService, SyncOnLoginService],
      multi: true,
    },
    provideHttpClient(withInterceptors([authInterceptor])),
    provideDataAccess({ apiBaseUrl: environment.apiBaseUrl }, environment.dataAccess),
    {
      provide: DATA_ACCESS_CONFIG,
      useFactory: (authService: AuthService) => ({
        apiBaseUrl: environment.apiBaseUrl,
        canSync: () => authService.hasAccess,
      }),
      deps: [AuthService],
    },
    { provide: CardCreator, useExisting: SelectedCollectionCardCreator },
  ],
};
