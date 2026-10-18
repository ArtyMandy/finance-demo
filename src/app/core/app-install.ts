import { computed, DestroyRef, DOCUMENT, inject, Service, signal } from '@angular/core';

/** Chromium-only event that lets the page show its own install button. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Offers installing the PWA once the browser says it is installable. */
@Service()
export class AppInstall {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly promptEvent = signal<BeforeInstallPromptEvent | undefined>(undefined);

  /** True while the browser allows showing the install dialog. */
  readonly canInstall = computed(() => this.promptEvent() !== undefined);

  constructor() {
    const onPrompt = (event: Event) => {
      // Keep the browser's own mini-infobar away; the header button takes over.
      event.preventDefault();
      this.promptEvent.set(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => this.promptEvent.set(undefined);
    this.window?.addEventListener('beforeinstallprompt', onPrompt);
    this.window?.addEventListener('appinstalled', onInstalled);
    inject(DestroyRef).onDestroy(() => {
      this.window?.removeEventListener('beforeinstallprompt', onPrompt);
      this.window?.removeEventListener('appinstalled', onInstalled);
    });
  }

  /** Shows the browser's install dialog. Returns true when the user accepted. */
  async install(): Promise<boolean> {
    const event = this.promptEvent();
    if (!event) return false;
    // The event can only be used once.
    this.promptEvent.set(undefined);
    await event.prompt();
    const { outcome } = await event.userChoice;
    return outcome === 'accepted';
  }
}
