import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AnimatedPressable } from './AnimatedPressable';
import { colors, spacing, radius, typography } from '../core/theme/theme';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PADDING_ITEMS = Math.floor(VISIBLE_ITEMS / 2);
const PADDING_TOP = ITEM_HEIGHT * PADDING_ITEMS;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

interface WheelProps {
  values: number[];
  initial: number;
  onChange: (value: number) => void;
}

/** Columna de rueda con snap: se desplaza como un carrete y deja el
 * número elegido dentro de la ventana central marcada. */
function Wheel({ values, initial, onChange }: WheelProps) {
  const initialIndex = Math.max(0, values.indexOf(initial));

  function applyOffset(offsetY: number) {
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(values.length - 1, index));
    onChange(values[clamped]);
  }

  function handleMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    applyOffset(e.nativeEvent.contentOffset.y);
  }

  // En arrastres lentos sin impulso, algunas plataformas no disparan
  // onMomentumScrollEnd — si la velocidad al soltar es ~0, ya llegó a su
  // posición final y se puede aplicar aquí mismo, sin esperar el momentum.
  function handleDragEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const velocityY = e.nativeEvent.velocity?.y ?? 0;
    if (Math.abs(velocityY) < 0.05) {
      applyOffset(e.nativeEvent.contentOffset.y);
    }
  }

  return (
    <FlatList
      data={values}
      keyExtractor={(v) => String(v)}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      // El offset que necesita `initialScrollIndex` para CENTRAR el ítem
      // en la ventana de selección es índice×alto (el padding superior ya
      // se cancela con el centrado — ver nota en el commit). No es la
      // posición física real dentro del contenido con padding, pero es lo
      // único que usamos de este prop.
      getItemLayout={(_, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
      initialScrollIndex={initialIndex}
      contentContainerStyle={{ paddingVertical: PADDING_TOP }}
      onMomentumScrollEnd={handleMomentumEnd}
      onScrollEndDrag={handleDragEnd}
      style={styles.wheel}
      renderItem={({ item }) => (
        <View style={styles.wheelItem}>
          <Text style={styles.wheelItemText}>{pad2(item)}</Text>
        </View>
      )}
    />
  );
}

interface TimePickerFieldProps {
  value: string; // "HH:mm"
  onChange: (time: string) => void;
}

/**
 * Selector de hora libre con diseño propio (dos ruedas, hora y minuto,
 * con la estética nocturna de Lumma) — no el picker del sistema
 * operativo, que rompía con el resto de la interfaz.
 */
export function TimePickerField({ value, onChange }: TimePickerFieldProps) {
  const [visible, setVisible] = useState(false);
  const [hour, minute] = value.split(':').map(Number);
  const [draftHour, setDraftHour] = useState(hour);
  const [draftMinute, setDraftMinute] = useState(minute);

  function openPicker() {
    setDraftHour(hour);
    setDraftMinute(minute);
    setVisible(true);
  }

  function confirm() {
    onChange(`${pad2(draftHour)}:${pad2(draftMinute)}`);
    setVisible(false);
  }

  return (
    <View>
      <AnimatedPressable onPress={openPicker} style={styles.button}>
        <Text style={styles.buttonText}>{value}</Text>
      </AnimatedPressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        {/* Se monta de cero cada vez que se abre (no solo se oculta), así
            las ruedas siempre arrancan centradas en el valor actual —
            nunca donde quedaron la última vez que se cerró sin confirmar.
            El Modal de React Native abre su propia raíz nativa, separada
            del GestureHandlerRootView de la app — sin este envoltorio
            propio, los gestos de arrastre de las ruedas no llegan a
            reconocerse y la rueda se queda estática. */}
        {visible && (
          <GestureHandlerRootView style={styles.gestureRoot}>
            <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
              <Pressable style={styles.card} onPress={() => {}}>
                <Text style={styles.cardTitle}>Elige la hora</Text>
                <View style={styles.wheelRow}>
                  <View style={styles.selectionWindow} pointerEvents="none" />
                  <Wheel values={HOURS} initial={draftHour} onChange={setDraftHour} />
                  <Text style={styles.colon}>:</Text>
                  <Wheel values={MINUTES} initial={draftMinute} onChange={setDraftMinute} />
                </View>
                <AnimatedPressable onPress={confirm} style={styles.confirmButton}>
                  <Text style={styles.confirmButtonText}>Listo</Text>
                </AnimatedPressable>
              </Pressable>
            </Pressable>
          </GestureHandlerRootView>
        )}
      </Modal>
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
  gestureRoot: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 260,
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
  wheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: WHEEL_HEIGHT,
    width: '100%',
  },
  selectionWindow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: PADDING_TOP,
    height: ITEM_HEIGHT,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: 'rgba(229, 196, 107, 0.08)',
  },
  wheel: {
    height: WHEEL_HEIGHT,
    width: 64,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelItemText: {
    ...typography.body,
    fontSize: 20,
    color: colors.ivory,
  },
  colon: {
    ...typography.title,
    color: colors.ivory,
    marginHorizontal: spacing.xs,
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
