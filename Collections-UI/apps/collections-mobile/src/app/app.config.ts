import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { CardCreator, SelectedCollectionCardCreator } from '@save-app/feature-inputs';
import { provideHttpClient } from '@angular/common/http';
import { provideDataAccess } from '@save-app/data-access';
import { environment } from '../environments/environments';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideDataAccess({ apiBaseUrl: environment.apiBaseUrl }),
    { provide: CardCreator, useExisting: SelectedCollectionCardCreator },
  ],
};
