import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useProfileStore } from '../src/stores/profileStore';
import { useThemeStore } from '../src/stores/themeStore';
import { wipeAllData } from '../src/core/db/database';
import {
  scheduleDailyPhraseReminder,
  scheduleMoodReminder,
} from '../src/services/notificationService';
import { AmbientSky } from '../src/components/AmbientSky';
import { AnimatedPressable } from '../src/components/AnimatedPressable';
import { TimePickerField } from '../src/components/TimePickerField';
import {
  ZODIAC_SIGNS,
  ZODIAC_LABELS,
  ZODIAC_SYMBOLS,
  type ZodiacSign,
  type Profile,
} from '../src/models';
import { useTheme } from '../src/core/theme/useTheme';
import { THEMES, type ThemeId } from '../src/core/theme/theme';
import type {
  ThemeColors,
  Typography,
  SpacingTokens,
  RadiusTokens,
} from '../src/core/theme/theme';

/** Ajustes: gestionar la cuenta local (apodo, signo, horarios de
 * recordatorio) y privacidad (qué se guarda, borrar todos los datos). */
export default function Settings() {
  const profile = useProfileStore((s) => s.profile);
  const save = useProfileStore((s) => s.save);
  const clear = useProfileStore((s) => s.clear);

  const selectedThemeId = useThemeStore((s) => s.selectedThemeId);
  const themeUnlocked = useThemeStore((s) => s.unlocked);
  const selectTheme = useThemeStore((s) => s.selectTheme);
  const devUnlock = useThemeStore((s) => s.devUnlock);
  const devLock = useThemeStore((s) => s.devLock);

  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(
    () => makeStyles(colors, spacing, radius, typography),
    [colors, spacing, radius, typography]
  );

  const [nickname, setNickname] = useState('');
  const [sign, setSign] = useState<ZodiacSign | null>(null);
  const [phraseTime, setPhraseTime] = useState('08:00');
  const [moodEnabled, setMoodEnabled] = useState(false);
  const [moodTime, setMoodTime] = useState('21:00');
  const [saving, setSaving] = useState(false);

  // Precarga el formulario con el perfil actual una vez que llega.
  useEffect(() => {
    if (!profile) return;
    setNickname(profile.nickname ?? '');
    setSign(profile.zodiacSign);
    setPhraseTime(profile.notificationTime);
    setMoodEnabled(profile.moodReminderEnabled);
    setMoodTime(profile.moodReminderTime ?? '21:00');
  }, [profile]);

  if (!profile || !sign) {
    return <View style={styles.root} />;
  }

  async function handleSave() {
    if (!profile || !sign) return;
    setSaving(true);
    try {
      const updated: Profile = {
        ...profile,
        nickname: nickname.trim() || null,
        zodiacSign: sign,
        notificationTime: phraseTime,
        moodReminderEnabled: moodEnabled,
        moodReminderTime: moodEnabled ? moodTime : null,
      };
      await save(updated);
      // No bloquea el guardado si el permiso de notificaciones falla.
      await Promise.all([
        scheduleDailyPhraseReminder(updated).catch((err: unknown) => {
          console.warn('No se pudo reprogramar la frase diaria', err);
        }),
        scheduleMoodReminder(updated).catch((err: unknown) => {
          console.warn('No se pudo reprogramar el recordatorio de ánimo', err);
        }),
      ]);
      router.back();
    } finally {
      setSaving(false);
    }
  }

  function handleThemePress(id: ThemeId) {
    const theme = THEMES[id];
    if (theme.free || themeUnlocked) {
      selectTheme(id);
      return;
    }
    Alert.alert(
      'Desbloquear temas',
      'Un solo pago único desbloquea los 4 temas visuales y quita los anuncios.\n\n(Marcador de prueba: todavía no está conectado a un cobro real de Play Store.)',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Simular compra — $2', onPress: () => devUnlock() },
      ]
    );
  }

  function handleWipe() {
    Alert.alert(
      'Borrar todos mis datos',
      'Esto elimina tu perfil, tus registros de ánimo y tus ajustes de este teléfono. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: async () => {
            await wipeAllData();
            clear();
            router.replace('/onboarding');
          },
        },
      ]
    );
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
            <View style={styles.headerRow}>
              <AnimatedPressable onPress={() => router.back()} style={styles.back}>
                <Text style={styles.backText}>{'‹'}</Text>
              </AnimatedPressable>
              <Text style={styles.title}>Ajustes</Text>
            </View>

            <Text style={styles.sectionTitle}>Mi cuenta</Text>

            <Text style={styles.sectionLabel}>
              ¿Cómo te llamamos? <Text style={styles.optional}>(opcional)</Text>
            </Text>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="Tu nombre"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              maxLength={40}
            />

            <Text style={styles.sectionLabel}>Tu signo</Text>
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
                      style={[styles.signGlyph, selected && styles.signGlyphSelected]}
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
              Recordatorio de tu lectura diaria
            </Text>
            <TimePickerField value={phraseTime} onChange={setPhraseTime} />

            <Text style={styles.sectionTitle}>Recordatorio de ánimo</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Recibir un recordatorio para registrar mi ánimo
              </Text>
              <Switch
                value={moodEnabled}
                onValueChange={setMoodEnabled}
                trackColor={{ false: colors.surfaceMuted, true: colors.gold }}
                thumbColor={colors.ivory}
              />
            </View>
            {moodEnabled && (
              <TimePickerField value={moodTime} onChange={setMoodTime} />
            )}

            <AnimatedPressable
              onPress={handleSave}
              disabled={saving}
              style={[styles.cta, saving && styles.ctaDisabled]}
            >
              <Text style={styles.ctaText}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Text>
            </AnimatedPressable>

            <Text style={styles.sectionTitle}>Apariencia</Text>
            <Text style={styles.privacy}>
              {themeUnlocked
                ? 'Ya tienes los temas desbloqueados y los anuncios quitados. Elige el que más te guste.'
                : 'Índigo Nocturno viene incluido. Un solo pago único desbloquea los otros 3 temas y quita los anuncios.'}
            </Text>
            <View style={styles.themeGrid}>
              {Object.values(THEMES).map((t) => {
                const selected = t.id === selectedThemeId;
                const locked = !t.free && !themeUnlocked;
                return (
                  <AnimatedPressable
                    key={t.id}
                    onPress={() => handleThemePress(t.id)}
                    style={[styles.themeCard, selected && styles.themeCardSelected]}
                  >
                    <View style={styles.themeSwatchRow}>
                      <View style={[styles.themeSwatch, { backgroundColor: t.colors.gold }]} />
                      <View
                        style={[
                          styles.themeSwatch,
                          styles.themeSwatchOverlap,
                          { backgroundColor: t.colors.lime },
                        ]}
                      />
                      <View
                        style={[
                          styles.themeSwatch,
                          styles.themeSwatchOverlap,
                          { backgroundColor: t.colors.lavender },
                        ]}
                      />
                    </View>
                    <Text style={styles.themeName}>{t.name}</Text>
                    <Text style={styles.themeTag}>
                      {selected ? 'Actual' : locked ? `🔒 ${t.tag}` : t.tag}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>
            {themeUnlocked && (
              <AnimatedPressable onPress={() => devLock()} style={styles.themeResetLink}>
                <Text style={styles.themeResetLinkText}>
                  Volver a bloquear los temas (solo pruebas)
                </Text>
              </AnimatedPressable>
            )}

            <Text style={styles.sectionTitle}>Privacidad y datos</Text>
            <Text style={styles.privacy}>
              Todo lo que registras (perfil, ánimo, ajustes) se guarda solo en
              este teléfono. Lumma no tiene cuentas ni servidor: nada de esto
              sale de tu dispositivo.
            </Text>
            <AnimatedPressable onPress={handleWipe} style={styles.danger}>
              <Text style={styles.dangerText}>Borrar todos mis datos</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  backText: {
    ...typography.title,
    color: colors.ivory,
    lineHeight: 28,
  },
  title: {
    ...typography.title,
    color: colors.ivory,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 13,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  switchLabel: {
    ...typography.body,
    color: colors.ivory,
    flex: 1,
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
  privacy: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  danger: {
    borderWidth: 1,
    borderColor: 'rgba(229, 90, 90, 0.4)',
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dangerText: {
    ...typography.body,
    fontWeight: '600',
    color: '#E55A5A',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  themeCard: {
    width: 132,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  themeCardSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.surfaceMuted,
  },
  themeSwatchRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  themeSwatch: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  themeSwatchOverlap: {
    marginLeft: -8,
  },
  themeName: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.ivory,
  },
  themeTag: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  themeResetLink: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  themeResetLinkText: {
    ...typography.caption,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  });
}
