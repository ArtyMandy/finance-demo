import { Component, inject, signal } from '@angular/core';
import { Notifications } from '../core/notifications';

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
})
export class Playground {
  private readonly notifications = inject(Notifications);

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
