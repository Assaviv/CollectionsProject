import { HttpInterceptorFn } from "@angular/common/http";
import { AuthService } from "./auth.service";
import { from, switchMap } from "rxjs";
import { inject } from "@angular/core";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  return from(auth.getToken()).pipe(
    switchMap(token =>
      next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req)
    )
  );
};

// TODO expose through index.ts, config the app and test