import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
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
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return null;

    // First cancel any existing reminder for this habit
    await cancelHabitReminder(habitId);

    const [hourStr, minuteStr] = reminderTime.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Time for ${title}! 🔥`,
        body: 'Keep your streak alive. Tap to check in.',
        data: { habitId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
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
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of scheduled) {
      if (item.content.data?.habitId === habitId) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }
  } catch (error) {
    console.warn(`Could not cancel notification for habit ${habitId}:`, error);
  }
}

