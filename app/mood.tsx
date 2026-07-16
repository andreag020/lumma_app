import { useEffect, useState } from 'react';
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
import { useEntryStore } from '../src/stores/entryStore';
import { useProfileStore } from '../src/stores/profileStore';
import { getDailyContent } from '../src/services/contentService';
import { todayISODate } from '../src/core/utils/date';
import { generateLocalId } from '../src/core/utils/id';
import { AdBanner } from '../src/components/AdBanner';
import { AmbientSky } from '../src/components/AmbientSky';
import { AnimatedPressable } from '../src/components/AnimatedPressable';
import { MOOD_PALETTE } from '../src/models';
import { colors, spacing, radius, typography } from '../src/core/theme/theme';

/** Registro de ánimo del día: color + etiqueta (paleta fija) + nota opcional.
 * Un registro por fecha — reabrir esta pantalla el mismo día edita el
 * registro existente en vez de crear uno nuevo. */
export default function Mood() {
  const profile = useProfileStore((s) => s.profile);
  const { entry, loaded, loadByDate, save } = useEntryStore();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [contentId, setContentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const today = todayISODate();

  useEffect(() => {
    loadByDate(today);
  }, [loadByDate, today]);

  // Prefill si ya existe un registro de hoy (permite editar).
  useEffect(() => {
    if (entry) {
      setSelectedColor(entry.moodColor);
      setNote(entry.note ?? '');
    }
  }, [entry]);

  // Vincula el registro con el contenido del día (mejor esfuerzo, no bloquea).
  useEffect(() => {
    if (!profile) return;
    getDailyContent(today, profile.zodiacSign).then((c) => {
      if (c) setContentId(c.contentId);
    });
  }, [profile, today]);

  const isEditing = entry !== null;
  const canSave = selectedColor !== null && !saving;

  async function handleSave() {
    if (!selectedColor) return;
    const option = MOOD_PALETTE.find((m) => m.color === selectedColor);
    if (!option) return;

    setSaving(true);
    try {
      await save({
        entryId: entry?.entryId ?? generateLocalId('entry'),
        date: today,
        moodColor: option.color,
        moodLabel: option.label,
        note: note.trim() || null,
        dailyPhraseId: contentId,
        astrologyMessageId: contentId,
      });
      router.back();
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
            <Text style={styles.eyebrow}>
              {isEditing ? 'Edita tu día' : 'Tu día de hoy'}
            </Text>
            <Text style={styles.title}>¿Cómo te sientes?</Text>
            <Text style={styles.lede}>
              Elige un color. Se sumará a tu firmamento personal.
            </Text>

            {!loaded ? null : (
              <>
                <View style={styles.grid}>
                  {MOOD_PALETTE.map((option) => {
                    const selected = option.color === selectedColor;
                    return (
                      <AnimatedPressable
                        key={option.color}
                        onPress={() => setSelectedColor(option.color)}
                        style={styles.moodItem}
                      >
                        <View
                          style={[
                            styles.swatch,
                            { backgroundColor: option.color },
                            selected && styles.swatchSelected,
                          ]}
                        />
                        <Text
                          style={[
                            styles.moodLabel,
                            selected && styles.moodLabelSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </AnimatedPressable>
                    );
                  })}
                </View>

                <Text style={styles.sectionLabel}>
                  Una nota <Text style={styles.optional}>(opcional)</Text>
                </Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="¿Algo que quieras recordar de hoy?"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  multiline
                  maxLength={280}
                />

                <AnimatedPressable
                  onPress={handleSave}
                  disabled={!canSave}
                  style={[styles.cta, !canSave && styles.ctaDisabled]}
                >
                  <Text style={styles.ctaText}>
                    {saving ? 'Guardando…' : 'Guardar'}
                  </Text>
                </AnimatedPressable>
              </>
            )}
            <AdBanner />
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  moodItem: {
    alignItems: 'center',
    width: 76,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: colors.ivory,
  },
  moodLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  moodLabelSelected: {
    color: colors.ivory,
    fontWeight: '600',
  },
  sectionLabel: {
    ...typography.body,
    color: colors.ivory,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  optional: {
    color: colors.textMuted,
    fontSize: 13,
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
    minHeight: 80,
    textAlignVertical: 'top',
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
