import { Component, inject, signal } from '@angular/core';
import { Notifications } from '../core/notifications';
import { Theme, ThemeService } from '../core/theme';

const MESSAGES = {
  shown: 'Benachrichtigung gesendet.',
  denied:
    'Benachrichtigungen sind blockiert. Erlaube sie in den Browser- bzw. App-Einstellungen und versuche es erneut.',
  unsupported:
    'Dieser Browser unterstützt keine Benachrichtigungen. Auf dem iPhone geht es nur in der installierten App (Zum Home-Bildschirm).',
  failed: 'Die Benachrichtigung konnte nicht angezeigt werden.',
};

/** Test area for features that are still being tried out. */
@Component({
  selector: 'app-playground',
  template: `
    <main id="inhalt" class="page">
      <div class="page-head">
        <div>
          <span class="eyebrow">Zum Ausprobieren</span>
          <h1>Playground</h1>
        </div>
      </div>

      <section class="card" aria-labelledby="theme-heading">
        <h2 id="theme-heading">Farbschema</h2>
        <fieldset class="themes">
          <legend class="meta">Wird auf diesem Gerät gespeichert.</legend>
          @for (option of themes; track option.value) {
            <label class="field-check">
              <input
                type="radio"
                name="theme"
                [value]="option.value"
                [checked]="theme.theme() === option.value"
                (change)="theme.set(option.value)"
              />
              <span class="swatch" [style.background]="option.color" aria-hidden="true"></span>
              {{ option.label }}
            </label>
          }
        </fieldset>
      </section>

      <section class="card" aria-labelledby="notification-heading">
        <h2 id="notification-heading">Benachrichtigung testen</h2>
        <p class="meta">
          Schickt dir die Nachricht „hey du“ als Systembenachrichtigung. Beim ersten Mal fragt der
          Browser, ob Benachrichtigungen erlaubt sind.
        </p>
        <div class="row">
          <button type="button" class="btn" [disabled]="sending()" (click)="send()">
            Benachrichtigung senden
          </button>
        </div>
        <p class="meta" role="status">{{ message() }}</p>
      </section>
    </main>
  `,
  styles: `
    .themes {
      display: flex;
      flex-wrap: wrap;
      gap: 0 1.5rem;
      margin: 0;
      padding: 0;
      border: 0;
    }
    .themes legend {
      margin-bottom: 0.25rem;
      padding: 0;
    }
    .swatch {
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
    }
  `,
})
export class Playground {
  private readonly notifications = inject(Notifications);
  protected readonly theme = inject(ThemeService);
  protected readonly themes: { value: Theme; label: string; color: string }[] = [
    { value: 'gruen', label: 'Grün', color: '#0f766e' },
    { value: 'rosa', label: 'Rosa', color: '#be185d' },
  ];

  protected readonly sending = signal(false);
  protected readonly message = signal(this.notifications.supported ? '' : MESSAGES.unsupported);

  protected async send(): Promise<void> {
    this.sending.set(true);
    try {
      this.message.set(MESSAGES[await this.notifications.show('hey du')]);
    } catch {
      this.message.set(MESSAGES.failed);
    } finally {
      this.sending.set(false);
    }
  }
}
