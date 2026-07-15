import { useState } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { AnimatedPressable } from './AnimatedPressable';
import { colors, spacing, radius, typography } from '../core/theme/theme';

function timeStringToDate(time: string): Date {
  const [hour, minute] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function dateToTimeString(d: Date): string {
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}

interface TimePickerFieldProps {
  value: string; // "HH:mm"
  onChange: (time: string) => void;
}

/**
 * Selector de hora libre (no horas preestablecidas): un botón con la hora
 * actual que abre el picker nativo de la plataforma. En Android el diálogo
 * se cierra solo al elegir; en iOS queda visible como spinner hasta tocar
 * "Listo".
 */
export function TimePickerField({ value, onChange }: TimePickerFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'dismissed' || !selected) return;
    onChange(dateToTimeString(selected));
  }

  return (
    <View>
      <AnimatedPressable onPress={() => setShowPicker(true)} style={styles.button}>
        <Text style={styles.buttonText}>{value}</Text>
      </AnimatedPressable>
      {showPicker && (
        <DateTimePicker
          value={timeStringToDate(value)}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
      {Platform.OS === 'ios' && showPicker && (
        <AnimatedPressable
          onPress={() => setShowPicker(false)}
          style={styles.doneButton}
        >
          <Text style={styles.doneButtonText}>Listo</Text>
        </AnimatedPressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.surfaceMuted,
  },
  buttonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.gold,
  },
  doneButton: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  doneButtonText: {
    ...typography.body,
    fontSize: 14,
    color: colors.lavender,
  },
});
