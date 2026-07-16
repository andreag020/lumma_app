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
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Canvas, Circle, Group, BlurMask, vec } from '@shopify/react-native-skia';
import { getEntriesInRange } from '../src/repositories/entryRepository';
import {
  FIRMAMENT_COLUMNS,
  allDaysGridPositions,
  entriesToFirmamentPoints,
  daysInYear,
  type FirmamentPoint,
} from '../src/features/firmament/layout';
import type { DailyEntry } from '../src/models';
import { AdBanner } from '../src/components/AdBanner';
import { AnimatedPressable } from '../src/components/AnimatedPressable';
import { formatLongDate } from '../src/core/utils/date';
import { colors, spacing, radius, typography } from '../src/core/theme/theme';
import { useTranslation } from '../src/core/i18n/useTranslation';

// Radio de toque alrededor de cada punto, en el espacio "de datos" (sin
// escalar) — al hacer zoom, el equivalente en pantalla crece con el
// zoom, así que acertar un punto se vuelve más fácil, no más difícil.
const HIT_RADIUS = 16;

const MIN_SCALE = 1;
const MAX_SCALE = 4;

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

// Puntos de fondo muy tenues: dan la forma del "cielo completo" del año
// aunque ese día no tenga registro. Se dibujan en el mismo Canvas de Skia
// (una sola superficie nativa), así que sumar ~365 no cuesta lo que
// costaría con componentes de React Native.
const BACKGROUND_DOT_COLOR = 'rgba(244, 239, 227, 0.12)';

// Primer año con datos posibles (fecha de nacimiento de Lumma). La lista
// del selector crece sola cada año que pasa — nunca hay que tocar esto.
const FIRST_YEAR = 2024;

export default function Firmament() {
  const { t, language } = useTranslation();
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
  // La superficie real de Skia se reserva con espacio de sobra para el
  // máximo zoom posible, así el contenido escalado nunca se recorta al
  // llegar al borde del lienzo — solo el contenedor visible (más abajo)
  // limita cuánto se ve, y ese límite crece junto con el zoom.
  const maxCanvasHeight = canvasHeight * MAX_SCALE;

  const backgroundDots = useMemo(
    () => allDaysGridPositions(year, FIRMAMENT_COLUMNS),
    [year]
  );
  const points = useMemo(
    () =>
      entries ? entriesToFirmamentPoints(entries, year, FIRMAMENT_COLUMNS) : [],
    [entries, year]
  );

  // Zoom (pellizcar) del firmamento, para poder acercarse y tocar una luz
  // concreta con más precisión. Ancla el origen en la parte de arriba (no
  // al centro): al acercar el zoom, el firmamento crece hacia abajo,
  // llenando la pantalla de forma orgánica sin taparse con el texto de
  // encabezado de arriba. El contenedor no recorta nada — su alto sigue
  // al zoom, y la pantalla completa se desplaza (scroll) para poder ver
  // el resto cuando ya no entra. Solo el desplazamiento horizontal usa
  // gesto de arrastre (el vertical lo resuelve el scroll de la pantalla).
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);

  /** Busca el punto más cercano al toque (ya convertido a espacio de
   * datos, sin el zoom/desplazamiento actual), dentro de un radio
   * cómodo. Ignora los puntos de fondo (no tienen registro que mostrar). */
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

  function maxTranslateXFor(currentScale: number) {
    'worklet';
    return (canvasWidth * (currentScale - 1)) / 2;
  }

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      const maxX = maxTranslateXFor(scale.value);
      translateX.value = withTiming(clamp(translateX.value, -maxX, maxX));
      savedTranslateX.value = clamp(savedTranslateX.value, -maxX, maxX);
    });

  // Solo arrastre horizontal (el vertical queda a cargo del scroll de la
  // pantalla, ver nota arriba). Se activa recién a partir de un pequeño
  // desplazamiento horizontal, para no competir con el scroll vertical.
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      const maxX = maxTranslateXFor(scale.value);
      translateX.value = clamp(savedTranslateX.value + e.translationX, -maxX, maxX);
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(1);
      translateX.value = withTiming(0);
      savedScale.value = 1;
      savedTranslateX.value = 0;
    });

  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd((e) => {
      const cx = canvasWidth / 2;
      const dataX = (e.x - translateX.value - (1 - scale.value) * cx) / scale.value;
      const dataY = e.y / scale.value;
      runOnJS(handleCanvasPress)(dataX, dataY);
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    Gesture.Exclusive(doubleTapGesture, singleTapGesture)
  );

  // Origen arriba-al-centro: el zoom crece desde el borde superior hacia
  // abajo (nunca hacia arriba, donde está el encabezado).
  const contentTransform = useDerivedValue(() => [
    { translateX: translateX.value },
    { scale: scale.value },
  ]);

  // El contenedor visible sigue el alto real del contenido ya escalado —
  // así el firmamento "crece" ocupando más pantalla en vez de recortarse
  // dentro de una caja fija.
  const wrapAnimatedStyle = useAnimatedStyle(() => ({
    height: canvasHeight * scale.value,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>{t('back')}</Text>
        </Pressable>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t('firmamentTitle')}</Text>
          <AnimatedPressable
            onPress={() => setPickerOpen(true)}
            style={styles.yearButton}
          >
            <Text style={styles.yearButtonText}>{year} ▾</Text>
          </AnimatedPressable>
        </View>
        <Text style={styles.subtitle}>
          {entries === null
            ? t('loading')
            : points.length === 1
              ? t('nightsRegisteredOne')
              : t('nightsRegisteredMany', { count: points.length })}
        </Text>
      </View>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <GestureHandlerRootView style={styles.gestureRoot}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setPickerOpen(false)}
          >
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>{t('chooseYear')}</Text>
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
        </GestureHandlerRootView>
      </Modal>

      {entries === null ? (
        <ActivityIndicator
          color={colors.gold}
          style={{ marginTop: spacing.xl }}
        />
      ) : (
        <ScrollView
          style={styles.canvasScroll}
          contentContainerStyle={styles.canvasScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <GestureDetector gesture={composedGesture}>
            <Animated.View
              style={[styles.canvasWrap, { width: canvasWidth }, wrapAnimatedStyle]}
            >
              <Canvas style={{ width: canvasWidth, height: maxCanvasHeight }}>
                <Group
                  transform={contentTransform}
                  origin={vec(canvasWidth / 2, 0)}
                >
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
                </Group>
              </Canvas>
            </Animated.View>
          </GestureDetector>
        </ScrollView>
      )}

      <AdBanner />

      <Modal
        visible={selectedPoint !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPoint(null)}
      >
        <GestureHandlerRootView style={styles.gestureRoot}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedPoint(null)}
        >
          {selectedPoint && (
            <Pressable style={styles.detailCard} onPress={() => {}}>
              <Text style={styles.detailDate}>
                {formatLongDate(selectedPoint.date, language)}
              </Text>
              <View style={styles.detailMoodRow}>
                <View
                  style={[styles.detailSwatch, { backgroundColor: selectedPoint.color }]}
                />
                <Text style={styles.detailMoodLabel}>{selectedPoint.label}</Text>
              </View>
              <Text style={styles.detailNote}>
                {selectedPoint.note ?? t('noNoteThatDay')}
              </Text>
              <AnimatedPressable
                onPress={() => setSelectedPoint(null)}
                style={styles.detailClose}
              >
                <Text style={styles.detailCloseText}>{t('close')}</Text>
              </AnimatedPressable>
            </Pressable>
          )}
        </Pressable>
        </GestureHandlerRootView>
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
  canvasScroll: {
    flex: 1,
  },
  canvasScrollContent: {
    paddingBottom: spacing.xl,
  },
  canvasWrap: {
    alignSelf: 'center',
    overflow: 'hidden',
  },
  gestureRoot: {
    flex: 1,
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
