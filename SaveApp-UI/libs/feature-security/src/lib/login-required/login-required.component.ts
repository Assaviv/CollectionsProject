import { Component, inject, Input } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'save-app-login-required',
  standalone: true,
  template: `
    <section class="login-required" aria-labelledby="login-required-title">
      <div class="login-required__icon" aria-hidden="true">🔒</div>
      <h2 id="login-required-title">Sign in to {{ feature }}</h2>
      <p>{{ description }}</p>
      <button type="button" (click)="login()">Sign in</button>
    </section>
  `,
  styles: [`
    .login-required { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.65rem; height:100%; min-height:12rem; padding:2rem; color:var(--app-body-text,#663300); text-align:center; }
    .login-required__icon { font-size:2rem; }
    h2, p { margin:0; }
    p { max-width:28rem; line-height:1.5; }
    button { margin-top:.35rem; padding:.65rem 1.1rem; border:0; border-radius:.5rem; color:var(--app-accent-text,#fff); background:var(--app-navigation,#663300); font:inherit; cursor:pointer; }
    button:focus-visible { outline:2px solid currentColor; outline-offset:3px; }
  `],
})
export class LoginRequiredComponent {
  private readonly auth = inject(AuthService);
  @Input() feature = 'this feature';
  @Input() description = 'Your collections stay available offline. Sign in to use server features and sync your data.';

  login(): void {
    void this.auth.login();
  }
}
