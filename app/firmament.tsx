import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
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
} from '../src/features/firmament/layout';
import type { DailyEntry } from '../src/models';
import { colors, spacing, typography } from '../src/core/theme/theme';

// Puntos de fondo muy tenues: dan la forma del "cielo completo" del año
// aunque ese día no tenga registro. Se dibujan en el mismo Canvas de Skia
// (una sola superficie nativa), así que sumar ~365 no cuesta lo que
// costaría con componentes de React Native.
const BACKGROUND_DOT_COLOR = 'rgba(244, 239, 227, 0.12)';

export default function Firmament() {
  const { width: screenWidth } = useWindowDimensions();
  const [entries, setEntries] = useState<DailyEntry[] | null>(null);
  const year = new Date().getFullYear();

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Volver</Text>
        </Pressable>
        <Text style={styles.title}>Tu firmamento {year}</Text>
        <Text style={styles.subtitle}>
          {entries === null
            ? 'Cargando…'
            : `${points.length} ${
                points.length === 1 ? 'noche registrada' : 'noches registradas'
              }`}
        </Text>
      </View>

      {entries === null ? (
        <ActivityIndicator
          color={colors.gold}
          style={{ marginTop: spacing.xl }}
        />
      ) : (
        <View
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
        </View>
      )}
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
  title: {
    ...typography.title,
    color: colors.ivory,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  canvasWrap: {
    alignSelf: 'center',
  },
});
