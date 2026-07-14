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
  durationX: number;
  durationY: number;
  delayX: number;
  delayY: number;
}

// Solo acentos de luz de la paleta de marca — nunca colores nuevos.
const LIGHT_COLORS = [colors.gold, colors.lavender, colors.lime, colors.ivory];

function makeLights(width: number, height: number, count: number): LightSpec[] {
  const lights: LightSpec[] = [];
  for (let i = 0; i < count; i++) {
    lights.push({
      baseX: Math.random() * width,
      baseY: Math.random() * height,
      driftX: 24 + Math.random() * 32,
      driftY: 18 + Math.random() * 26,
      radius: 1.3 + Math.random() * 2,
      color: LIGHT_COLORS[i % LIGHT_COLORS.length],
      // Duraciones distintas en X e Y (más un desfase de arranque) para
      // que la trayectoria sea un vaivén, no una diagonal recta — se
      // siente más parecido al vuelo errático de una luciérnaga.
      durationX: 3200 + Math.random() * 2800,
      durationY: 3800 + Math.random() * 3200,
      delayX: Math.random() * 2000,
      delayY: 300 + Math.random() * 2000,
    });
  }
  return lights;
}

function FloatingLight({ light }: { light: LightSpec }) {
  const progressX = useSharedValue(0);
  const progressY = useSharedValue(0);

  useEffect(() => {
    progressX.value = withDelay(
      light.delayX,
      withRepeat(
        withTiming(1, {
          duration: light.durationX,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
    progressY.value = withDelay(
      light.delayY,
      withRepeat(
        withTiming(1, {
          duration: light.durationY,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
    // Cada luz anima una sola vez al montar; no depende de props que cambien.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cx = useDerivedValue(() => light.baseX + progressX.value * light.driftX);
  const cy = useDerivedValue(() => light.baseY - progressY.value * light.driftY);
  const haloOpacity = useDerivedValue(() => 0.25 + progressX.value * 0.55);
  const coreOpacity = useDerivedValue(() => 0.55 + progressY.value * 0.45);

  return (
    <>
      {/* Halo: el resplandor difuso, con el color de la luz. */}
      <Circle cx={cx} cy={cy} r={light.radius} color={light.color} opacity={haloOpacity}>
        <BlurMask blur={light.radius * 1.8} style="normal" />
      </Circle>
      {/* Núcleo: un punto pequeño y más brillante, casi blanco — como el
          centro caliente de una luciérnaga o una estrella. */}
      <Circle
        cx={cx}
        cy={cy}
        r={light.radius * 0.4}
        color={colors.ivory}
        opacity={coreOpacity}
      >
        <BlurMask blur={0.5} style="normal" />
      </Circle>
    </>
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
