import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Profile } from '../models';
import { parseTime, pickReminderMessage } from './notificationText';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Recordatorio diario',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Programa (o reprograma) el recordatorio diario a la hora del perfil.
 * Local únicamente — sin servidor, sin push remoto. Si la usuaria no
 * concede permiso, no hace nada: las notificaciones son un extra, nunca
 * bloquean el uso de la app.
 */
export async function scheduleDailyReminder(profile: Profile): Promise<void> {
  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return;

  await ensureAndroidChannel();
  // Solo programamos este tipo de recordatorio en toda la app, así que
  // cancelar todo antes de reprogramar evita duplicados sin necesidad de
  // llevar un registro de identificadores.
  await Notifications.cancelAllScheduledNotificationsAsync();

  const [hour, minute] = parseTime(profile.notificationTime);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Lumma',
      body: pickReminderMessage(profile.notificationTime),
      // Silenciosa: coherente con una app de calma nocturna.
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}
