import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, Link, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useProfileStore } from '../src/stores/profileStore';
import { useEntryStore } from '../src/stores/entryStore';
import { getDailyContent } from '../src/services/contentService';
import { scheduleDailyPhraseReminder } from '../src/services/notificationService';
import { todayISODate } from '../src/core/utils/date';
import { AmbientSky } from '../src/components/AmbientSky';
import { AnimatedPressable } from '../src/components/AnimatedPressable';
import {
  ZODIAC_LABELS,
  ZODIAC_SYMBOLS,
  type DailyContent,
} from '../src/models';
import { useTheme } from '../src/core/theme/useTheme';
import { useTranslation } from '../src/core/i18n/useTranslation';
import type {
  ThemeColors,
  ThemeFonts,
  Typography,
  SpacingTokens,
  RadiusTokens,
} from '../src/core/theme/theme';

/** Home: astrología del día + frase, o redirección a onboarding sin perfil. */
export default function Index() {
  const profile = useProfileStore((s) => s.profile);
  const loaded = useProfileStore((s) => s.loaded);
  const load = useProfileStore((s) => s.load);
  const [content, setContent] = useState<DailyContent | null>(null);
  const [contentLoaded, setContentLoaded] = useState(false);
  const { t } = useTranslation();

  // Store compartido con la pantalla de ánimo: al volver de /mood, esta
  // pantalla se actualiza sola porque ambas leen el mismo estado global.
  const todayEntry = useEntryStore((s) => s.entry);
  const loadEntry = useEntryStore((s) => s.loadByDate);

  const { colors, spacing, radius, typography, fonts } = useTheme();
  const styles = useMemo(
    () => makeStyles(colors, spacing, radius, typography, fonts),
    [colors, spacing, radius, typography, fonts]
  );

  // Cambia en cada enfoque de la pantalla (no solo al montar) para volver
  // a montar el bloque animado de abajo y así repetir la entrada
  // escalonada cada vez que se vuelve a Home (p.ej. desde Ajustes).
  const [focusKey, setFocusKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setFocusKey((k) => k + 1);
    }, [])
  );

  useEffect(() => {
    load();
    loadEntry(todayISODate());
  }, [load, loadEntry]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    getDailyContent(todayISODate(), profile.zodiacSign, profile.language).then((c) => {
      if (!cancelled) {
        setContent(c);
        setContentLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  // Recordatorio de la FRASE diaria (no de ánimo). Local únicamente, sin
  // bloquear la carga de Home si el permiso falla.
  useEffect(() => {
    if (!profile) return;
    scheduleDailyPhraseReminder(profile).catch((err: unknown) => {
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
    <View style={styles.root}>
      <AmbientSky />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View key={focusKey} style={styles.animatedRoot}>
        <Animated.View
          entering={FadeInDown.delay(0).duration(450)}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>
                {profile.nickname
                  ? t('greetingWithName', { name: profile.nickname })
                  : t('greetingNoName')}
              </Text>
              <Text style={styles.sign}>
                {ZODIAC_LABELS[profile.language][profile.zodiacSign]}
              </Text>
            </View>
            <Text style={styles.glyph}>{ZODIAC_SYMBOLS[profile.zodiacSign]}</Text>
            <Link href="/settings" asChild>
              <AnimatedPressable style={styles.settingsButton}>
                <Text style={styles.settingsIcon}>{'⚙︎'}</Text>
              </AnimatedPressable>
            </Link>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(130).duration(450)}>
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
              <Text style={styles.astrology}>{t('noContentFallback')}</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(260).duration(450)}
          style={styles.actions}
        >
          {todayEntry && (
            <View style={styles.todayPreview}>
              <View
                style={[styles.dot, { backgroundColor: todayEntry.moodColor }]}
              />
              <Text style={styles.todayPreviewText}>
                {t('todayPreview', { label: todayEntry.moodLabel })}
              </Text>
            </View>
          )}

          <Link href="/mood" asChild>
            <AnimatedPressable style={styles.moodButton}>
              <Text style={styles.moodButtonText}>
                {todayEntry ? t('moodButtonEdit') : t('moodButtonNew')}
              </Text>
            </AnimatedPressable>
          </Link>

          <Link href="/firmament" asChild>
            <AnimatedPressable style={styles.firmamentLink}>
              <Text style={styles.firmamentLinkText}>{t('firmamentLink')}</Text>
            </AnimatedPressable>
          </Link>
        </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(
  colors: ThemeColors,
  spacing: SpacingTokens,
  radius: RadiusTokens,
  typography: Typography,
  fonts: ThemeFonts
) {
  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  animatedRoot: {
    flex: 1,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  glyph: {
    fontSize: 40,
    color: colors.gold,
    marginLeft: spacing.md,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  settingsIcon: {
    fontSize: 16,
    color: colors.textSecondary,
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
    fontFamily: fonts.quote,
    fontSize: 19,
    lineHeight: 26,
    color: colors.lavender,
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
}
