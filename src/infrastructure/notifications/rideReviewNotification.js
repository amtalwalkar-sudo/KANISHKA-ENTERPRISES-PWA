import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

export const notifyRideReview = async ride => {
  const body = `${ride.operator} · ₹${Number(ride.fare).toFixed(2)} · ${Number(ride.rideKm).toFixed(1)} km`
  if (Capacitor.isNativePlatform()) {
    const permission = await LocalNotifications.checkPermissions()
    if (permission.display !== 'granted') {
      const requested = await LocalNotifications.requestPermissions()
      if (requested.display !== 'granted') return { ok: false, reason: 'Notification permission was not granted.' }
    }
    await LocalNotifications.schedule({ notifications: [{ id: Date.now() % 2147483647, title: 'KFE Ride detected', body, extra: { route: '/ride-capture' }, schedule: { at: new Date(Date.now() + 250) } }] })
    return { ok: true, channel: 'native' }
  }
  if (typeof Notification === 'undefined') return { ok: false, reason: 'Notifications are unavailable on this platform.' }
  if (Notification.permission === 'default') await Notification.requestPermission()
  if (Notification.permission !== 'granted') return { ok: false, reason: 'Notification permission was not granted.' }
  const notification = new Notification('KFE Ride detected', { body })
  notification.onclick = () => { window.focus(); window.location.hash = '#/ride-capture' }
  return { ok: true, channel: 'web' }
}
