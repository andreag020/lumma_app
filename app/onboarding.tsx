import { useState } from 'react';
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
  type Language,
} from '../src/models';
import { colors, spacing, radius, typography } from '../src/core/theme/theme';
import { useTranslation } from '../src/core/i18n/useTranslation';
import { detectDeviceLanguage } from '../src/core/i18n/device';

const DEFAULT_MODULES = ['astrology', 'mood', 'firmament'];

export default function Onboarding() {
  const save = useProfileStore((s) => s.save);
  const [sign, setSign] = useState<ZodiacSign | null>(null);
  const [time, setTime] = useState('08:00');
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  // Sin perfil todavía: el idioma parte del dispositivo y se puede
  // cambiar aquí mismo; a partir de "Comenzar mi ritual" vive en el perfil.
  const [language, setLanguage] = useState<Language>(() => detectDeviceLanguage());
  const { t } = useTranslation(language);

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
        language,
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
            <View style={styles.languageRow}>
              {(['es', 'en'] as const).map((lang) => {
                const selected = lang === language;
                return (
                  <AnimatedPressable
                    key={lang}
                    onPress={() => setLanguage(lang)}
                    style={[styles.languageChip, selected && styles.languageChipSelected]}
                  >
                    <Text
                      style={[
                        styles.languageChipText,
                        selected && styles.languageChipTextSelected,
                      ]}
                    >
                      {lang === 'es' ? t('languageSpanish') : t('languageEnglish')}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>

            <Text style={styles.eyebrow}>{t('onboardingEyebrow')}</Text>
            <Text style={styles.title}>{t('onboardingTitle')}</Text>
            <Text style={styles.lede}>{t('onboardingLede')}</Text>

            <Text style={styles.sectionLabel}>{t('onboardingSignQuestion')}</Text>
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
                      {ZODIAC_LABELS[language][s]}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>{t('onboardingTimeQuestion')}</Text>
            <TimePickerField value={time} onChange={setTime} />

            <Text style={styles.sectionLabel}>
              {t('onboardingNicknameQuestion')}{' '}
              <Text style={styles.optional}>{t('optional')}</Text>
            </Text>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder={t('nicknamePlaceholder')}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              maxLength={40}
            />

            <Text style={styles.privacy}>{t('onboardingPrivacy')}</Text>

            <AnimatedPressable
              onPress={handleContinue}
              disabled={!canContinue}
              style={[styles.cta, !canContinue && styles.ctaDisabled]}
            >
              <Text style={styles.ctaText}>
                {saving ? t('onboardingSaving') : t('onboardingCta')}
              </Text>
            </AnimatedPressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  languageChip: {
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  languageChipSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.surfaceMuted,
  },
  languageChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  languageChipTextSelected: {
    color: colors.gold,
    fontWeight: '600',
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
