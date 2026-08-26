// KFE Push Notification infrastructure boundary.
// No business logic lives here. Server-side Web Push delivery can be added later.

const KFE_PUSH_EVENT = 'kfe:push-notification';

export function isPushSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.requestPermission();
}

export async function getPushSubscription() {
  if (!('serviceWorker' in navigator)) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export function publishPushEvent(payload) {
  window.dispatchEvent(new CustomEvent(KFE_PUSH_EVENT, { detail: payload }));
}

export function onPushEvent(handler) {
  const listener = event => handler(event.detail);
  window.addEventListener(KFE_PUSH_EVENT, listener);
  return () => window.removeEventListener(KFE_PUSH_EVENT, listener);
}

// Server integration intentionally remains outside the UI/domain layers.
export const pushNotificationContract = Object.freeze({
  event: KFE_PUSH_EVENT,
  payload: ['title', 'body', 'data'],
  delivery: 'Web Push via Service Worker',
  policy: 'urgent operational alerts only'
});
