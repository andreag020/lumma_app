import { useEffect, useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Circle,
  BlurMask,
  LinearGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../core/theme/theme';

interface LightSpec {
  baseX: number;
  baseY: number;
  driftX: number;
  driftY: number;
  radius: number;
  color: string;
  duration: number;
  delay: number;
}

// Solo acentos de luz de la paleta de marca — nunca colores nuevos.
const LIGHT_COLORS = [colors.gold, colors.lavender, colors.lime, colors.ivory];

function makeLights(width: number, height: number, count: number): LightSpec[] {
  const lights: LightSpec[] = [];
  for (let i = 0; i < count; i++) {
    lights.push({
      baseX: Math.random() * width,
      baseY: Math.random() * height,
      driftX: 14 + Math.random() * 22,
      driftY: 10 + Math.random() * 18,
      radius: 1.3 + Math.random() * 2,
      color: LIGHT_COLORS[i % LIGHT_COLORS.length],
      duration: 4200 + Math.random() * 3600,
      delay: Math.random() * 2400,
    });
  }
  return lights;
}

function FloatingLight({ light }: { light: LightSpec }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      light.delay,
      withRepeat(
        withTiming(1, {
          duration: light.duration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
    // Cada luz anima una sola vez al montar; no depende de props que cambien.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cx = useDerivedValue(() => light.baseX + progress.value * light.driftX);
  const cy = useDerivedValue(() => light.baseY - progress.value * light.driftY);
  const opacity = useDerivedValue(() => 0.2 + progress.value * 0.5);

  return (
    <Circle cx={cx} cy={cy} r={light.radius} color={light.color} opacity={opacity}>
      <BlurMask blur={light.radius * 1.8} style="normal" />
    </Circle>
  );
}

interface AmbientSkyProps {
  /** Cantidad de luces flotantes. Discreta a propósito — es ambiente, no protagonista. */
  density?: number;
}

/**
 * Fondo ambiental decorativo: degradado nocturno sutil + luces flotantes
 * tipo luciérnaga/estrella. Se coloca detrás del contenido de la pantalla
 * (absolute, sin capturar toques). El firmamento (T9) no la usa — ya es
 * su propio cielo.
 */
export function AmbientSky({ density = 14 }: AmbientSkyProps) {
  const { width, height } = useWindowDimensions();
  const lights = useMemo(
    () => makeLights(width, height, density),
    [width, height, density]
  );

  if (width === 0 || height === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(width, height)}
            colors={[colors.background, colors.surfaceMuted, colors.background]}
          />
        </Rect>
        {lights.map((light, i) => (
          <FloatingLight key={i} light={light} />
        ))}
      </Canvas>
    </View>
  );
}
