import { HttpRequest, HttpResponse } from '@angular/common/http';
import { runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let injector: EnvironmentInjector;
  let auth: { getToken: jest.Mock<Promise<string | undefined>, []> };
  const request = new HttpRequest('GET', '/api/collections');

  beforeEach(() => {
    auth = { getToken: jest.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: auth }] });
    injector = TestBed.inject(EnvironmentInjector);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('adds a bearer token to the outgoing request', async () => {
    auth.getToken.mockResolvedValue('access-token');
    let forwarded: HttpRequest<unknown> | undefined;
    const response = new HttpResponse({ status: 200 });
    const result = runInInjectionContext(injector, () =>
      authInterceptor(request, (req) => {
        forwarded = req;
        return of(response);
      })
    );

    await expect(firstValueFrom(result)).resolves.toBe(response);
    expect(forwarded?.headers.get('Authorization')).toBe('Bearer access-token');
    expect(request.headers.has('Authorization')).toBe(false);
  });

  it('forwards the original request when no token is available', async () => {
    auth.getToken.mockResolvedValue(undefined);
    let forwarded: HttpRequest<unknown> | undefined;
    const result = runInInjectionContext(injector, () =>
      authInterceptor(request, (req) => {
        forwarded = req;
        return of(new HttpResponse({ status: 200 }));
      })
    );

    await firstValueFrom(result);
    expect(forwarded).toBe(request);
  });
});
