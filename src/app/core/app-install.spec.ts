import { TestBed } from '@angular/core/testing';
import { AppInstall, BeforeInstallPromptEvent } from './app-install';

function promptEvent(outcome: 'accepted' | 'dismissed'): BeforeInstallPromptEvent {
  return Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn(async () => undefined),
    userChoice: Promise.resolve({ outcome }),
  });
}

describe('AppInstall', () => {
  it('should not offer installing before the browser allows it', () => {
    expect(TestBed.inject(AppInstall).canInstall()).toBe(false);
  });

  it('should offer installing after beforeinstallprompt and suppress the browser banner', () => {
    const appInstall = TestBed.inject(AppInstall);
    const event = promptEvent('accepted');
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(appInstall.canInstall()).toBe(true);
  });

  it('should show the install dialog once and report the outcome', async () => {
    const appInstall = TestBed.inject(AppInstall);
    const event = promptEvent('accepted');
    window.dispatchEvent(event);

    await expect(appInstall.install()).resolves.toBe(true);
    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(appInstall.canInstall()).toBe(false);
  });

  it('should report a dismissed dialog', async () => {
    const appInstall = TestBed.inject(AppInstall);
    window.dispatchEvent(promptEvent('dismissed'));

    await expect(appInstall.install()).resolves.toBe(false);
  });

  it('should hide the button once the app is installed', () => {
    const appInstall = TestBed.inject(AppInstall);
    window.dispatchEvent(promptEvent('accepted'));
    window.dispatchEvent(new Event('appinstalled'));

    expect(appInstall.canInstall()).toBe(false);
  });
});
