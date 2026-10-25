import { TestBed } from '@angular/core/testing';
import { Notifications } from './notifications';

class FakeNotification {
  static permission: NotificationPermission = 'default';
  static requestPermission = vi.fn(async () => FakeNotification.permission);
  static created: string[] = [];
  constructor(title: string) {
    FakeNotification.created.push(title);
  }
}

describe('Notifications', () => {
  let showNotification: ReturnType<typeof vi.fn>;
  let registration: { showNotification: typeof showNotification } | undefined;

  beforeEach(() => {
    FakeNotification.permission = 'default';
    FakeNotification.created = [];
    FakeNotification.requestPermission.mockImplementation(async () => {
      FakeNotification.permission = 'granted';
      return 'granted';
    });
    showNotification = vi.fn(async () => undefined);
    registration = { showNotification };
    vi.stubGlobal('Notification', FakeNotification);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { getRegistration: async () => registration },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, 'serviceWorker');
  });

  it('asks for permission and shows the notification through the service worker', async () => {
    const notifications = TestBed.inject(Notifications);
    expect(await notifications.show('hey du')).toBe('shown');
    expect(FakeNotification.requestPermission).toHaveBeenCalled();
    expect(showNotification).toHaveBeenCalledWith('hey du', expect.objectContaining({ body: '' }));
  });

  it('falls back to a page notification without a service worker', async () => {
    FakeNotification.permission = 'granted';
    registration = undefined;
    expect(await TestBed.inject(Notifications).show('hey du')).toBe('shown');
    expect(FakeNotification.created).toEqual(['hey du']);
  });

  it('reports blocked notifications', async () => {
    FakeNotification.permission = 'denied';
    expect(await TestBed.inject(Notifications).show('hey du')).toBe('denied');
    expect(showNotification).not.toHaveBeenCalled();
  });
});
