import { Platform } from 'react-native';

// Lazy-load notifications to prevent early initialization context errors on Android/Expo Go
let Notifications: typeof import('expo-notifications') | null = null;
let isHandlerConfigured = false;

async function getNotificationsModule() {
  if (Platform.OS === 'web') return null;
  if (!Notifications) {
    try {
      Notifications = await import('expo-notifications');
      if (!isHandlerConfigured && Notifications?.setNotificationHandler) {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        isHandlerConfigured = true;
      }
    } catch (e) {
      console.warn('Failed to load expo-notifications module:', e);
      return null;
    }
  }
  return Notifications;
}

/**
 * Request notification permissions from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const notif = await getNotificationsModule();
    if (!notif) return false;

    const { status: existingStatus } = await notif.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await notif.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Notification permission request error:', error);
    return false;
  }
}

/**
 * Schedule a daily local reminder for a habit
 * @param habitId Unique identifier for habit
 * @param title Habit title
 * @param reminderTime "HH:mm" (24h)
 * @returns Notification ID or null
 */
export async function scheduleHabitReminder(
  habitId: string,
  title: string,
  reminderTime: string
): Promise<string | null> {
  try {
    const notif = await getNotificationsModule();
    if (!notif) return null;

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return null;

    // First cancel any existing reminder for this habit
    await cancelHabitReminder(habitId);

    const [hourStr, minuteStr] = reminderTime.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    const notificationId = await notif.scheduleNotificationAsync({
      content: {
        title: `Time for ${title}! 🔥`,
        body: 'Keep your streak alive. Tap to check in.',
        data: { habitId },
      },
      trigger: {
        type: notif.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    return notificationId;
  } catch (error) {
    console.warn(`Could not schedule notification for habit ${habitId}:`, error);
    return null;
  }
}

/**
 * Cancel all scheduled notifications for a habit
 */
export async function cancelHabitReminder(habitId: string): Promise<void> {
  try {
    const notif = await getNotificationsModule();
    if (!notif) return;

    const scheduled = await notif.getAllScheduledNotificationsAsync();
    for (const item of scheduled) {
      if (item.content.data?.habitId === habitId) {
        await notif.cancelScheduledNotificationAsync(item.identifier);
      }
    }
  } catch (error) {
    console.warn(`Could not cancel notification for habit ${habitId}:`, error);
  }
}

