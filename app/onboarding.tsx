import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
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
import { ZODIAC_SIGNS, ZODIAC_LABELS, type ZodiacSign } from '../src/models';
import { colors, spacing, radius, typography } from '../src/core/theme/theme';

// Horas preseleccionadas en vez de un time-picker nativo: evita sumar una
// dependencia nativa nueva justo tras resolver un problema de compatibilidad
// de SDK, y alcanza para el MVP (ver tasks/plan.md "Boundaries").
const NOTIFICATION_TIMES = ['07:00', '12:00', '18:00', '21:00', '22:00'];
const DEFAULT_MODULES = ['astrology', 'mood', 'firmament'];

export default function Onboarding() {
  const save = useProfileStore((s) => s.save);
  const [sign, setSign] = useState<ZodiacSign | null>(null);
  const [time, setTime] = useState('21:00');
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);

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
                <Pressable
                  key={s}
                  onPress={() => setSign(s)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {ZODIAC_LABELS[s]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>
            ¿Cuándo quieres tu recordatorio?
          </Text>
          <View style={styles.row}>
            {NOTIFICATION_TIMES.map((t) => {
              const selected = t === time;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTime(t)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>

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

          <Text style={styles.privacy}>
            Esto se guarda solo en tu teléfono. Puedes borrarlo cuando
            quieras desde Ajustes.
          </Text>

          <Pressable
            onPress={handleContinue}
            disabled={!canContinue}
            style={[styles.cta, !canContinue && styles.ctaDisabled]}
          >
            <Text style={styles.ctaText}>
              {saving ? 'Guardando…' : 'Comenzar mi ritual'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
