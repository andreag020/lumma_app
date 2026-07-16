import { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { AnimatedPressable } from './AnimatedPressable';
import { colors, spacing, radius, typography } from '../core/theme/theme';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function timeStringToDate(value: string): Date {
  const [h, m] = value.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function dateToTimeString(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

interface TimePickerFieldProps {
  value: string; // "HH:mm"
  onChange: (time: string) => void;
}

/**
 * Selector de hora con el picker nativo del sistema (rueda tipo
 * "spinner" de toda la vida, no el reloj/calendario de Material 3 que
 * no encajaba con la estética de Lumma) — se probó antes un selector
 * propio hecho con FlatList, pero el gesto de arrastre no llegaba a
 * reconocerse de forma confiable en dispositivo real. El picker nativo
 * resuelve eso porque el arrastre lo maneja el sistema operativo, no
 * JavaScript.
 *
 * En iOS se muestra embebido dentro de una tarjeta propia (con la
 * paleta oscura de Lumma). En Android el sistema solo permite mostrarlo
 * como diálogo nativo (API imperativa) — no se puede incrustar dentro
 * de una tarjeta propia — así que se abre directamente al tocar el
 * botón, sin envoltorio propio.
 */
export function TimePickerField({ value, onChange }: TimePickerFieldProps) {
  const [visible, setVisible] = useState(false);
  const [draftDate, setDraftDate] = useState<Date>(() => timeStringToDate(value));

  function openPicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: timeStringToDate(value),
        mode: 'time',
        is24Hour: true,
        // `design: 'default'` mantiene el picker "spinner" clásico (rueda
        // de números) en vez del reloj/calendario de Material 3.
        design: 'default',
        display: 'spinner',
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) onChange(dateToTimeString(selected));
        },
      });
      return;
    }
    setDraftDate(timeStringToDate(value));
    setVisible(true);
  }

  function handleIOSChange(_event: DateTimePickerEvent, selected?: Date) {
    if (selected) setDraftDate(selected);
  }

  function confirm() {
    onChange(dateToTimeString(draftDate));
    setVisible(false);
  }

  return (
    <View>
      <AnimatedPressable onPress={openPicker} style={styles.button}>
        <Text style={styles.buttonText}>{value}</Text>
      </AnimatedPressable>

      {Platform.OS === 'ios' && (
        <Modal
          visible={visible}
          transparent
          animationType="fade"
          onRequestClose={() => setVisible(false)}
        >
          {visible && (
            <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
              <Pressable style={styles.card} onPress={() => {}}>
                <Text style={styles.cardTitle}>Elige la hora</Text>
                <DateTimePicker
                  value={draftDate}
                  mode="time"
                  display="spinner"
                  themeVariant="dark"
                  locale="es-ES"
                  onChange={handleIOSChange}
                  style={styles.picker}
                />
                <AnimatedPressable onPress={confirm} style={styles.confirmButton}>
                  <Text style={styles.confirmButtonText}>Listo</Text>
                </AnimatedPressable>
              </Pressable>
            </Pressable>
          )}
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 280,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  cardTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ivory,
    marginBottom: spacing.md,
  },
  picker: {
    width: 240,
    height: 180,
  },
  confirmButton: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  confirmButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.background,
  },
});
