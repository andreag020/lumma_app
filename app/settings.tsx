import { useEffect, useState } from 'react';
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
import { wipeAllData } from '../src/core/db/database';
import {
  scheduleDailyPhraseReminder,
  scheduleMoodReminder,
} from '../src/services/notificationService';
import { AmbientSky } from '../src/components/AmbientSky';
import { AnimatedPressable } from '../src/components/AnimatedPressable';
import { NOTIFICATION_TIMES } from '../src/core/constants';
import {
  ZODIAC_SIGNS,
  ZODIAC_LABELS,
  ZODIAC_SYMBOLS,
  type ZodiacSign,
  type Profile,
} from '../src/models';
import { colors, spacing, radius, typography } from '../src/core/theme/theme';

/** Ajustes: gestionar la cuenta local (apodo, signo, horarios de
 * recordatorio) y privacidad (qué se guarda, borrar todos los datos). */
export default function Settings() {
  const profile = useProfileStore((s) => s.profile);
  const save = useProfileStore((s) => s.save);
  const clear = useProfileStore((s) => s.clear);

  const [nickname, setNickname] = useState('');
  const [sign, setSign] = useState<ZodiacSign | null>(null);
  const [phraseTime, setPhraseTime] = useState('08:00');
  const [moodEnabled, setMoodEnabled] = useState(false);
  const [moodTime, setMoodTime] = useState('21:00');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

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
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
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
            <View style={styles.row}>
              {NOTIFICATION_TIMES.map((t) => {
                const selected = t === phraseTime;
                return (
                  <AnimatedPressable
                    key={t}
                    onPress={() => setPhraseTime(t)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {t}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>

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
              <View style={styles.row}>
                {NOTIFICATION_TIMES.map((t) => {
                  const selected = t === moodTime;
                  return (
                    <AnimatedPressable
                      key={t}
                      onPress={() => setMoodTime(t)}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      <Text
                        style={[styles.chipText, selected && styles.chipTextSelected]}
                      >
                        {t}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
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
            {savedAt !== null && (
              <Text style={styles.savedText}>Cambios guardados ✓</Text>
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
  row: {
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
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.surfaceMuted,
  },
  chipText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.gold,
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
  savedText: {
    ...typography.caption,
    color: colors.lime,
    textAlign: 'center',
    marginTop: spacing.sm,
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
});
