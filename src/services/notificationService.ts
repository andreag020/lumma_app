import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Profile } from '../models';
import { getDailyContent } from './contentService';
import { parseTime, buildPhraseNotificationContent } from './notificationText';
import { addDays, todayISODate } from '../core/utils/date';

// Canal propio (no "default"): cuando se agregue el recordatorio de ánimo
// configurable desde Ajustes (tasks/todo.md T11), debe vivir en su propio
// canal de Android, separado de este.
const PHRASE_CHANNEL_ID = 'daily-phrase';

// Una notificación por día (no una repetitiva con texto genérico) — cada
// una lleva la lectura real del signo para esa fecha, como una entrega de
// periódico. iOS limita a 64 notificaciones locales pendientes por app;
// 21 días deja margen de sobra para un futuro recordatorio de ánimo (T11)
// y se renueva cada vez que se llama esta función (p. ej. al abrir Home).
const ROLLING_WINDOW_DAYS = 21;

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
 * Programa una notificación por cada uno de los próximos
 * `ROLLING_WINDOW_DAYS` días, a la hora del perfil, con la lectura real
 * del signo para esa fecha (estilo horóscopo de periódico) — no un texto
 * genérico. Local únicamente — sin servidor, sin push remoto. Si la
 * usuaria no concede permiso, no hace nada: las notificaciones son un
 * extra, nunca bloquean el uso de la app.
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
  const today = todayISODate();

  for (let offset = 0; offset < ROLLING_WINDOW_DAYS; offset++) {
    const date = addDays(today, offset);

    const fireDate = new Date(`${date}T00:00:00`);
    fireDate.setHours(hour, minute, 0, 0);
    if (fireDate.getTime() <= Date.now()) continue; // ya pasó hoy — se salta

    const content = await getDailyContent(date, profile.zodiacSign);
    if (!content) continue; // sin lectura para esa fecha: no se inventa una

    const { title, body } = buildPhraseNotificationContent(
      profile.zodiacSign,
      content
    );

    await Notifications.scheduleNotificationAsync({
      identifier: `${PHRASE_CHANNEL_ID}-${date}`,
      content: {
        title,
        body,
        // Silenciosa: coherente con una app de calma.
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
        channelId: PHRASE_CHANNEL_ID,
      },
    });
  }
}
