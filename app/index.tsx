import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, Link } from 'expo-router';
import { useProfileStore } from '../src/stores/profileStore';
import { useEntryStore } from '../src/stores/entryStore';
import { getDailyContent } from '../src/services/contentService';
import { scheduleDailyReminder } from '../src/services/notificationService';
import { todayISODate } from '../src/core/utils/date';
import { ZODIAC_LABELS, type DailyContent } from '../src/models';
import { colors, spacing, radius, typography } from '../src/core/theme/theme';

/** Home: astrología del día + frase, o redirección a onboarding sin perfil. */
export default function Index() {
  const profile = useProfileStore((s) => s.profile);
  const loaded = useProfileStore((s) => s.loaded);
  const load = useProfileStore((s) => s.load);
  const [content, setContent] = useState<DailyContent | null>(null);
  const [contentLoaded, setContentLoaded] = useState(false);

  // Store compartido con la pantalla de ánimo: al volver de /mood, esta
  // pantalla se actualiza sola porque ambas leen el mismo estado global.
  const todayEntry = useEntryStore((s) => s.entry);
  const loadEntry = useEntryStore((s) => s.loadByDate);

  useEffect(() => {
    load();
    loadEntry(todayISODate());
  }, [load, loadEntry]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    getDailyContent(todayISODate(), profile.zodiacSign).then((c) => {
      if (!cancelled) {
        setContent(c);
        setContentLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  // Local únicamente, sin bloquear la carga de Home si el permiso falla.
  useEffect(() => {
    if (!profile) return;
    scheduleDailyReminder(profile).catch((err) => {
      console.warn('No se pudo programar el recordatorio diario', err);
    });
  }, [profile?.notificationTime]);

  if (!loaded) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator color={colors.gold} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {profile.nickname ? `Hola, ${profile.nickname}` : 'Hola de nuevo'}
        </Text>
        <Text style={styles.sign}>{ZODIAC_LABELS[profile.zodiacSign]}</Text>
      </View>

      {!contentLoaded ? (
        <ActivityIndicator
          color={colors.gold}
          style={{ marginTop: spacing.xl }}
        />
      ) : content ? (
        <View style={styles.card}>
          <Text style={styles.astrology}>{content.shortAstrologyText}</Text>
          <View style={styles.divider} />
          <Text style={styles.phrase}>&ldquo;{content.dailyPhrase}&rdquo;</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.astrology}>
            Hoy no encontramos tu guía astrológica. Vuelve a intentarlo
            mañana.
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        {todayEntry && (
          <View style={styles.todayPreview}>
            <View
              style={[styles.dot, { backgroundColor: todayEntry.moodColor }]}
            />
            <Text style={styles.todayPreviewText}>
              Hoy: {todayEntry.moodLabel}
            </Text>
          </View>
        )}

        <Link href="/mood" asChild>
          <Pressable style={styles.moodButton}>
            <Text style={styles.moodButtonText}>
              {todayEntry
                ? 'Editar mi ánimo de hoy'
                : 'Registrar mi ánimo de hoy'}
            </Text>
          </Pressable>
        </Link>

        <Link href="/firmament" asChild>
          <Pressable style={styles.firmamentLink}>
            <Text style={styles.firmamentLinkText}>
              Ver mi firmamento personal
            </Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.title,
    color: colors.ivory,
  },
  sign: {
    ...typography.caption,
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  astrology: {
    ...typography.body,
    color: colors.ivory,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  phrase: {
    ...typography.body,
    color: colors.lavender,
    fontStyle: 'italic',
  },
  actions: {
    marginTop: 'auto',
    gap: spacing.sm,
  },
  todayPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },
  todayPreviewText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  moodButton: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  moodButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.gold,
  },
  firmamentLink: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  firmamentLinkText: {
    ...typography.body,
    fontSize: 14,
    color: colors.lavender,
  },
});
