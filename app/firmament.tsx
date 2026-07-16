import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Canvas, Circle, BlurMask } from '@shopify/react-native-skia';
import { getEntriesInRange } from '../src/repositories/entryRepository';
import {
  FIRMAMENT_COLUMNS,
  allDaysGridPositions,
  entriesToFirmamentPoints,
  daysInYear,
  type FirmamentPoint,
} from '../src/features/firmament/layout';
import type { DailyEntry } from '../src/models';
import { AnimatedPressable } from '../src/components/AnimatedPressable';
import { formatLongDateEs } from '../src/core/utils/date';
import { colors, spacing, radius, typography } from '../src/core/theme/theme';

// Radio de toque alrededor de cada punto (más grande que el punto en sí,
// para que sea cómodo tocarlo con el dedo).
const HIT_RADIUS = 16;

// Puntos de fondo muy tenues: dan la forma del "cielo completo" del año
// aunque ese día no tenga registro. Se dibujan en el mismo Canvas de Skia
// (una sola superficie nativa), así que sumar ~365 no cuesta lo que
// costaría con componentes de React Native.
const BACKGROUND_DOT_COLOR = 'rgba(244, 239, 227, 0.12)';

// Primer año con datos posibles (fecha de nacimiento de Lumma). La lista
// del selector crece sola cada año que pasa — nunca hay que tocar esto.
const FIRST_YEAR = 2024;

export default function Firmament() {
  const { width: screenWidth } = useWindowDimensions();
  const [entries, setEntries] = useState<DailyEntry[] | null>(null);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<FirmamentPoint | null>(null);

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear; y >= FIRST_YEAR; y--) years.push(y);
    return years;
  }, [currentYear]);

  useEffect(() => {
    let cancelled = false;
    getEntriesInRange(`${year}-01-01`, `${year}-12-31`).then((rows) => {
      if (!cancelled) setEntries(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [year]);

  const canvasWidth = screenWidth - spacing.lg * 2;
  const rows = Math.ceil(daysInYear(year) / FIRMAMENT_COLUMNS);
  const canvasHeight = canvasWidth * (rows / FIRMAMENT_COLUMNS);

  const backgroundDots = useMemo(
    () => allDaysGridPositions(year, FIRMAMENT_COLUMNS),
    [year]
  );
  const points = useMemo(
    () =>
      entries ? entriesToFirmamentPoints(entries, year, FIRMAMENT_COLUMNS) : [],
    [entries, year]
  );

  /** Busca el punto más cercano al toque, dentro de un radio cómodo.
   * Ignora los puntos de fondo (no tienen registro que mostrar). */
  function handleCanvasPress(x: number, y: number) {
    let closest: FirmamentPoint | null = null;
    let closestDist = Infinity;
    for (const p of points) {
      const dist = Math.hypot(p.x * canvasWidth - x, p.y * canvasHeight - y);
      if (dist <= HIT_RADIUS && dist < closestDist) {
        closest = p;
        closestDist = dist;
      }
    }
    if (closest) setSelectedPoint(closest);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Volver</Text>
        </Pressable>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Tu firmamento</Text>
          <AnimatedPressable
            onPress={() => setPickerOpen(true)}
            style={styles.yearButton}
          >
            <Text style={styles.yearButtonText}>{year} ▾</Text>
          </AnimatedPressable>
        </View>
        <Text style={styles.subtitle}>
          {entries === null
            ? 'Cargando…'
            : `${points.length} ${
                points.length === 1 ? 'noche registrada' : 'noches registradas'
              }`}
        </Text>
      </View>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPickerOpen(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Elige un año</Text>
            <ScrollView style={styles.modalList}>
              {yearOptions.map((y) => {
                const selected = y === year;
                return (
                  <AnimatedPressable
                    key={y}
                    onPress={() => {
                      setYear(y);
                      setPickerOpen(false);
                    }}
                    style={[
                      styles.yearOption,
                      selected && styles.yearOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.yearOptionText,
                        selected && styles.yearOptionTextSelected,
                      ]}
                    >
                      {y}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {entries === null ? (
        <ActivityIndicator
          color={colors.gold}
          style={{ marginTop: spacing.xl }}
        />
      ) : (
        <Pressable
          onPress={(e) => handleCanvasPress(e.nativeEvent.locationX, e.nativeEvent.locationY)}
          style={[
            styles.canvasWrap,
            { width: canvasWidth, height: canvasHeight },
          ]}
        >
          <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
            {backgroundDots.map((d) => (
              <Circle
                key={`bg-${d.row}-${d.col}`}
                cx={d.x * canvasWidth}
                cy={d.y * canvasHeight}
                r={1.4}
                color={BACKGROUND_DOT_COLOR}
              />
            ))}
            {points.map((p) => (
              <Circle
                key={p.date}
                cx={p.x * canvasWidth}
                cy={p.y * canvasHeight}
                r={5.5}
                color={p.color}
              >
                <BlurMask blur={5} style="normal" />
              </Circle>
            ))}
          </Canvas>
        </Pressable>
      )}

      <Modal
        visible={selectedPoint !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPoint(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedPoint(null)}
        >
          {selectedPoint && (
            <Pressable style={styles.detailCard} onPress={() => {}}>
              <Text style={styles.detailDate}>
                {formatLongDateEs(selectedPoint.date)}
              </Text>
              <View style={styles.detailMoodRow}>
                <View
                  style={[styles.detailSwatch, { backgroundColor: selectedPoint.color }]}
                />
                <Text style={styles.detailMoodLabel}>{selectedPoint.label}</Text>
              </View>
              <Text style={styles.detailNote}>
                {selectedPoint.note ?? 'Sin nota ese día.'}
              </Text>
              <AnimatedPressable
                onPress={() => setSelectedPoint(null)}
                style={styles.detailClose}
              >
                <Text style={styles.detailCloseText}>Cerrar</Text>
              </AnimatedPressable>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  back: {
    ...typography.body,
    color: colors.lavender,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.ivory,
  },
  yearButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.surfaceMuted,
  },
  yearButtonText: {
    ...typography.caption,
    color: colors.gold,
    fontWeight: '600',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  canvasWrap: {
    alignSelf: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: 220,
    maxHeight: 340,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  modalTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ivory,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalList: {
    flexGrow: 0,
  },
  yearOption: {
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  yearOptionSelected: {
    backgroundColor: colors.surfaceMuted,
  },
  yearOptionText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  yearOptionTextSelected: {
    color: colors.gold,
    fontWeight: '600',
  },
  detailCard: {
    width: 280,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  detailDate: {
    ...typography.caption,
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  detailMoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailSwatch: {
    width: 16,
    height: 16,
    borderRadius: radius.pill,
  },
  detailMoodLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ivory,
  },
  detailNote: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  detailClose: {
    marginTop: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  detailCloseText: {
    ...typography.body,
    fontSize: 14,
    color: colors.lavender,
  },
});
