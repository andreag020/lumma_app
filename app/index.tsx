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
import { getDailyContent } from '../src/services/contentService';
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

  useEffect(() => {
    load();
  }, [load]);

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

      <Link href="/mood" asChild>
        <Pressable style={styles.moodButton}>
          <Text style={styles.moodButtonText}>Registrar mi ánimo de hoy</Text>
        </Pressable>
      </Link>
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
  moodButton: {
    marginTop: 'auto',
    marginBottom: spacing.md,
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
});
