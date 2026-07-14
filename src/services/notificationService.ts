import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Profile } from '../models';
import { parseTime, pickPhraseReminderMessage } from './notificationText';

// Canal propio (no "default"): cuando se agregue el recordatorio de ánimo
// configurable desde Ajustes (tasks/todo.md T11), debe vivir en su propio
// canal de Android, separado de este.
const PHRASE_CHANNEL_ID = 'daily-phrase';

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
  await Notifications.setNotificationChannelAsync(PHRASE_CHANNEL_ID, {
    name: 'Frase diaria',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Programa (o reprograma) el recordatorio diario para leer la frase del
 * día, a la hora del perfil. Local únicamente — sin servidor, sin push
 * remoto. Si la usuaria no concede permiso, no hace nada: las
 * notificaciones son un extra, nunca bloquean el uso de la app.
 *
 * Este recordatorio es sobre la frase diaria, no sobre el ánimo — un
 * recordatorio de ánimo aparte se configurará desde Ajustes más adelante
 * (T11) y no debe reutilizar este canal ni cancelar sus notificaciones.
 */
export async function scheduleDailyPhraseReminder(
  profile: Profile
): Promise<void> {
  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return;

  await ensureAndroidChannel();
  // Solo cancelamos las notificaciones de ESTE canal (frase diaria), no
  // todas — el futuro recordatorio de ánimo vivirá en su propio canal y
  // no debe verse afectado por esta reprogramación.
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(PHRASE_CHANNEL_ID))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );

  const [hour, minute] = parseTime(profile.notificationTime);

  await Notifications.scheduleNotificationAsync({
    identifier: `${PHRASE_CHANNEL_ID}-${profile.userIdLocal}`,
    content: {
      title: 'Lumma',
      body: pickPhraseReminderMessage(profile.notificationTime),
      // Silenciosa: coherente con una app de calma nocturna.
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: PHRASE_CHANNEL_ID,
    },
  });
}
