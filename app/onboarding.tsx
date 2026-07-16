import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useProfileStore } from '../src/stores/profileStore';
import { generateLocalId } from '../src/core/utils/id';
import { AmbientSky } from '../src/components/AmbientSky';
import { AnimatedPressable } from '../src/components/AnimatedPressable';
import { TimePickerField } from '../src/components/TimePickerField';
import {
  ZODIAC_SIGNS,
  ZODIAC_LABELS,
  ZODIAC_SYMBOLS,
  type ZodiacSign,
} from '../src/models';
import { useTheme } from '../src/core/theme/useTheme';
import type {
  ThemeColors,
  Typography,
  SpacingTokens,
  RadiusTokens,
} from '../src/core/theme/theme';

const DEFAULT_MODULES = ['astrology', 'mood', 'firmament'];

export default function Onboarding() {
  const save = useProfileStore((s) => s.save);
  const [sign, setSign] = useState<ZodiacSign | null>(null);
  const [time, setTime] = useState('08:00');
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);

  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(
    () => makeStyles(colors, spacing, radius, typography),
    [colors, spacing, radius, typography]
  );

  const canContinue = sign !== null && !saving;

  async function handleContinue() {
    if (!sign) return;
    setSaving(true);
    try {
      await save({
        userIdLocal: generateLocalId('user'),
        nickname: nickname.trim() || null,
        zodiacSign: sign,
        birthDate: null,
        notificationTime: time,
        moodReminderEnabled: false,
        moodReminderTime: null,
        language: 'es',
        enabledModules: DEFAULT_MODULES,
        themePreferences: {},
      });
      router.replace('/');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <AmbientSky density={10} />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.eyebrow}>Bienvenida a Lumma</Text>
            <Text style={styles.title}>Tu ritual nocturno empieza aquí</Text>
            <Text style={styles.lede}>
              Solo dos cosas antes de tu primer firmamento: tu signo y a qué
              hora quieres tu recordatorio.
            </Text>

            <Text style={styles.sectionLabel}>¿Cuál es tu signo?</Text>
            <View style={styles.grid}>
              {ZODIAC_SIGNS.map((s) => {
                const selected = s === sign;
                return (
                  <AnimatedPressable
                    key={s}
                    onPress={() => setSign(s)}
                    style={[styles.signChip, selected && styles.signChipSelected]}
                  >
                    <Text
                      style={[
                        styles.signGlyph,
                        selected && styles.signGlyphSelected,
                      ]}
                    >
                      {ZODIAC_SYMBOLS[s]}
                    </Text>
                    <Text
                      style={[
                        styles.signChipText,
                        selected && styles.signChipTextSelected,
                      ]}
                    >
                      {ZODIAC_LABELS[s]}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>
              ¿Cuándo quieres tu recordatorio?
            </Text>
            <TimePickerField value={time} onChange={setTime} />

            <Text style={styles.sectionLabel}>
              ¿Cómo te llamamos?{' '}
              <Text style={styles.optional}>(opcional)</Text>
            </Text>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="Tu nombre"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              maxLength={40}
            />

            <Text style={styles.privacy}>
              Esto se guarda solo en tu teléfono. Puedes borrarlo cuando
              quieras desde Ajustes.
            </Text>

            <AnimatedPressable
              onPress={handleContinue}
              disabled={!canContinue}
              style={[styles.cta, !canContinue && styles.ctaDisabled]}
            >
              <Text style={styles.ctaText}>
                {saving ? 'Guardando…' : 'Comenzar mi ritual'}
              </Text>
            </AnimatedPressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(
  colors: ThemeColors,
  spacing: SpacingTokens,
  radius: RadiusTokens,
  typography: Typography
) {
  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.ivory,
    marginBottom: spacing.sm,
  },
  lede: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.body,
    color: colors.ivory,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  optional: {
    color: colors.textMuted,
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  signChip: {
    width: 76,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  signChipSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.surfaceMuted,
  },
  signGlyph: {
    fontSize: 22,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  signGlyphSelected: {
    color: colors.gold,
  },
  signChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  signChipTextSelected: {
    color: colors.ivory,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    color: colors.ivory,
    fontSize: 16,
  },
  privacy: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.lg,
    lineHeight: 18,
  },
  cta: {
    marginTop: spacing.xl,
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.background,
  },
  });
}
