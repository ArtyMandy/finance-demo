import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, minLength, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../core/auth';

type Mode = 'signIn' | 'signUp';

const ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'E-Mail oder Passwort ist falsch.',
  'Email not confirmed': 'Bitte bestätige zuerst deine E-Mail-Adresse.',
  'User already registered': 'Für diese E-Mail-Adresse gibt es schon ein Konto.',
};

@Component({
  imports: [FormField, RouterLink],
  selector: 'app-login',
  template: `
    <main class="login">
      <h1>{{ mode() === 'signIn' ? 'Anmelden' : 'Registrieren' }}</h1>

      <form class="login-form" novalidate (submit)="onSubmit(); $event.preventDefault()">
        <label>
          E-Mail
          <input type="email" autocomplete="email" [formField]="loginForm.email" />
          @if (loginForm.email().touched() && loginForm.email().errors().length) {
            <span class="field-error">{{ loginForm.email().errors()[0].message }}</span>
          }
        </label>

        <label>
          Passwort
          <input
            type="password"
            [attr.autocomplete]="mode() === 'signIn' ? 'current-password' : 'new-password'"
            [formField]="loginForm.password"
          />
          @if (loginForm.password().touched() && loginForm.password().errors().length) {
            <span class="field-error">{{ loginForm.password().errors()[0].message }}</span>
          }
        </label>

        <button type="submit" class="button" [disabled]="busy()">
          {{ mode() === 'signIn' ? 'Anmelden' : 'Konto erstellen' }}
        </button>
      </form>

      <div aria-live="polite">
        @if (message(); as text) {
          <p class="message">{{ text }}</p>
        }
      </div>

      <button type="button" class="link-button" (click)="toggleMode()">
        {{ mode() === 'signIn' ? 'Noch kein Konto? Registrieren' : 'Schon ein Konto? Anmelden' }}
      </button>
      <a routerLink="/">Zur Startseite</a>
    </main>
  `,
  styles: `
    .login {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 22rem;
      margin: 0 auto;
      padding: 3rem 1rem;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-weight: 600;
    }

    input {
      padding: 0.625rem 0.75rem;
      border: 1px solid #64748b;
      border-radius: 0.5rem;
      font: inherit;
    }

    .field-error {
      color: #b91c1c;
      font-weight: 400;
    }

    .message {
      margin: 0;
    }

    .link-button {
      align-self: flex-start;
      padding: 0;
      border: none;
      background: none;
      color: var(--color-primary);
      font: inherit;
      text-decoration: underline;
      cursor: pointer;
    }

    a {
      color: var(--color-primary);
    }
  `,
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  protected readonly mode = signal<Mode>('signIn');
  protected readonly busy = signal(false);
  protected readonly message = signal('');

  protected readonly model = signal({ email: '', password: '' });

  protected readonly loginForm = form(this.model, (s) => {
    required(s.email, { message: 'Bitte gib deine E-Mail-Adresse ein.' });
    email(s.email, { message: 'Bitte gib eine gültige E-Mail-Adresse ein.' });
    required(s.password, { message: 'Bitte gib ein Passwort ein.' });
    minLength(s.password, 6, { message: 'Das Passwort muss mindestens 6 Zeichen lang sein.' });
  });

  protected toggleMode(): void {
    this.mode.update((mode) => (mode === 'signIn' ? 'signUp' : 'signIn'));
    this.message.set('');
  }

  protected onSubmit(): void {
    submit(this.loginForm, async () => {
      const { email, password } = this.model();
      this.busy.set(true);
      this.message.set('');
      try {
        if (this.mode() === 'signUp' && (await this.auth.signUp(email, password))) {
          this.message.set('Fast fertig: Bitte bestätige deine E-Mail-Adresse über den Link in der E-Mail.');
          return;
        }
        if (this.mode() === 'signIn') {
          await this.auth.signIn(email, password);
        }
        await this.router.navigateByUrl('/einkommen');
      } catch (error) {
        const text = error instanceof Error ? error.message : '';
        this.message.set(ERROR_MESSAGES[text] ?? `Das hat nicht geklappt: ${text}`);
      } finally {
        this.busy.set(false);
      }
    });
  }
}
