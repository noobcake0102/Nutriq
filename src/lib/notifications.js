import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

const isNative = () => Capacitor.isNativePlatform()

// Ask for notification permission (no-op on web)
export async function requestNotificationPermission() {
  if (!isNative()) return false
  try {
    const { display } = await LocalNotifications.requestPermissions()
    return display === 'granted'
  } catch { return false }
}

// Schedule on-device reminders for items expiring within `withinDays`.
// Fires at 9am the day before each item's expiry. Re-syncs the full set each call.
export async function syncExpiryReminders(pantry, withinDays = 3) {
  if (!isNative()) return
  try {
    const perm = await LocalNotifications.checkPermissions()
    if (perm.display !== 'granted') {
      const granted = await requestNotificationPermission()
      if (!granted) return
    }

    // Clear our previously scheduled expiry notifications (ids 1000-1999)
    const pending = await LocalNotifications.getPending()
    const ours = pending.notifications.filter(n => n.id >= 1000 && n.id < 2000)
    if (ours.length) await LocalNotifications.cancel({ notifications: ours.map(n => ({ id: n.id })) })

    const now = Date.now()
    const toSchedule = []
    pantry.forEach((item, idx) => {
      if (!item.expiry) return
      const daysLeft = Math.ceil((item.expiry - now) / 864e5)
      if (daysLeft < 0 || daysLeft > withinDays) return
      // Fire at 9am the day before expiry (or now+1min if that's already past)
      let fireAt = new Date(item.expiry - 864e5)
      fireAt.setHours(9, 0, 0, 0)
      if (fireAt.getTime() < now) fireAt = new Date(now + 60_000)
      toSchedule.push({
        id: 1000 + (idx % 1000),
        title: 'Use it before it goes',
        body: `${item.name} expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Plan a meal with it?`,
        schedule: { at: fireAt },
        smallIcon: 'ic_stat_icon',
      })
    })
    if (toSchedule.length) await LocalNotifications.schedule({ notifications: toSchedule })
  } catch (e) { console.error('syncExpiryReminders error:', e) }
}

// Weekly meal-plan reminder — Sunday 5pm
export async function scheduleWeeklyPlanReminder() {
  if (!isNative()) return
  try {
    const perm = await LocalNotifications.checkPermissions()
    if (perm.display !== 'granted') return
    await LocalNotifications.cancel({ notifications: [{ id: 2000 }] })
    await LocalNotifications.schedule({
      notifications: [{
        id: 2000,
        title: 'Plan your week',
        body: "Ready to set this week's meals? Tap to build your plan.",
        schedule: { on: { weekday: 1, hour: 17, minute: 0 } }, // 1 = Sunday
        smallIcon: 'ic_stat_icon',
      }],
    })
  } catch (e) { console.error('scheduleWeeklyPlanReminder error:', e) }
}
