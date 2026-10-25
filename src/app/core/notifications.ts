import { DOCUMENT, inject, Service } from '@angular/core';

export type NotificationResult = 'shown' | 'denied' | 'unsupported';

/**
 * Shows system notifications. In the installed PWA they go through the service worker,
 * so they look like push messages and a tap opens the app.
 */
@Service()
export class Notifications {
  private readonly window = inject(DOCUMENT).defaultView;

  readonly supported = !!this.window && 'Notification' in this.window;

  /** Asks for permission if needed (must run in a click handler) and shows the notification. */
  async show(title: string, body = ''): Promise<NotificationResult> {
    const window = this.window;
    if (!window || !('Notification' in window)) return 'unsupported';
    if (window.Notification.permission === 'default') {
      await window.Notification.requestPermission();
    }
    if (window.Notification.permission !== 'granted') return 'denied';

    const options: NotificationOptions = {
      body,
      icon: 'icons/icon-192x192.png',
      badge: 'icons/icon-192x192.png',
      // Read by the Angular service worker: a tap focuses the app or opens it.
      data: { onActionClick: { default: { operation: 'focusLastFocusedOrOpen', url: './' } } },
    };
    const registration = await window.navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.showNotification(title, options);
    } else {
      // No service worker (e.g. `ng serve`): plain page notification, desktop browsers only.
      new window.Notification(title, options);
    }
    return 'shown';
  }
}
