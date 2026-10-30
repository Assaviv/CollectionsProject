import { Injectable, InjectionToken, Injector } from '@angular/core';
import { CardsManagmentService } from './cards-managment.service';

@Injectable({
  providedIn: 'root',
})
export class CardsManagmentFactoryService {
  constructor(private injector: Injector) {}

  create(collectionId: string): CardsManagmentService {
    const injector = Injector.create({
      providers: [
        { provide: COLLECTION_ID, useValue: collectionId },
        { provide: CardsManagmentService, useClass: CardsManagmentService },
      ],
      parent: this.injector,
    });

    return injector.get(CardsManagmentService);
  }
}

export const COLLECTION_ID = new InjectionToken<string>('COLLECTION_ID');
