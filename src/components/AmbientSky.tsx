import { useEffect, useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Line,
  BlurMask,
  LinearGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withSequence,
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
  twinkleDuration: number;
  twinkleDelay: number;
}

interface ConstellationPair {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// Solo acentos de luz de la paleta de marca — nunca colores nuevos.
const LIGHT_COLORS = [colors.gold, colors.lavender, colors.lime, colors.ivory];

// Máximo de líneas simultáneas: da la sensación de constelación sin
// convertirse en una telaraña que compita con las luces.
const MAX_CONSTELLATION_LINES = 6;

function connectionThreshold(width: number, height: number): number {
  return Math.min(width, height) * 0.32;
}

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
      // Titileo de intensidad, independiente del desplazamiento: período
      // propio y más corto, para que se sienta como el parpadeo real de
      // una estrella y no solo "más brillante cuando se mueve más".
      twinkleDuration: 1400 + Math.random() * 2000,
      twinkleDelay: Math.random() * 1800,
    });
  }
  return lights;
}

/** Pares de luces cercanas (por posición base) para dibujar líneas de
 * constelación entre ellas. Se limita a las más cercanas para que el
 * efecto siga siendo discreto. Determinista una vez generado. */
function makeConstellationPairs(
  lights: LightSpec[],
  width: number,
  height: number
): ConstellationPair[] {
  const maxDist = connectionThreshold(width, height);
  const candidates: { dist: number; pair: ConstellationPair }[] = [];

  for (let i = 0; i < lights.length; i++) {
    for (let j = i + 1; j < lights.length; j++) {
      const a = lights[i];
      const b = lights[j];
      const dx = a.baseX - b.baseX;
      const dy = a.baseY - b.baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= maxDist) {
        candidates.push({
          dist,
          pair: { x1: a.baseX, y1: a.baseY, x2: b.baseX, y2: b.baseY },
        });
      }
    }
  }

  candidates.sort((a, b) => a.dist - b.dist);
  return candidates.slice(0, MAX_CONSTELLATION_LINES).map((c) => c.pair);
}

function FloatingLight({ light }: { light: LightSpec }) {
  const progressX = useSharedValue(0);
  const progressY = useSharedValue(0);
  const twinkle = useSharedValue(0);

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
    twinkle.value = withDelay(
      light.twinkleDelay,
      withRepeat(
        withTiming(1, {
          duration: light.twinkleDuration,
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
  // El titileo domina la intensidad — desplazamiento y brillo ya no están
  // atados al mismo reloj, así que la luz parpadea aunque esté quieta.
  const haloOpacity = useDerivedValue(() => 0.22 + twinkle.value * 0.58);
  const coreOpacity = useDerivedValue(() => 0.5 + twinkle.value * 0.5);

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

/** Línea fina entre dos luces cercanas, que aparece, se sostiene y se
 * desvanece en un ciclo propio — como constelaciones que se dibujan y
 * se borran solas en el cielo. */
function ConstellationLine({ pair }: { pair: ConstellationPair }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const fadeIn = 1400 + Math.random() * 1200;
    const hold = 900 + Math.random() * 1400;
    const fadeOut = 1600 + Math.random() * 1400;
    const gap = 2200 + Math.random() * 3200;
    const startDelay = Math.random() * 4000;

    progress.value = withDelay(
      startDelay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: fadeIn, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: hold }),
          withTiming(0, { duration: fadeOut, easing: Easing.in(Easing.quad) }),
          withTiming(0, { duration: gap })
        ),
        -1,
        false
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sutil: la línea acompaña a las luces que conecta, nunca compite con ellas.
  const opacity = useDerivedValue(() => progress.value * 0.4);

  return (
    <Line
      p1={vec(pair.x1, pair.y1)}
      p2={vec(pair.x2, pair.y2)}
      color={colors.constellationLine}
      strokeWidth={0.6}
      opacity={opacity}
    />
  );
}

interface AmbientSkyProps {
  /** Cantidad de luces flotantes. Discreta a propósito — es ambiente, no protagonista. */
  density?: number;
}

/**
 * Fondo ambiental decorativo: degradado nocturno sutil + luces flotantes
 * tipo luciérnaga/estrella que titilan de forma independiente + líneas
 * finas de constelación que conectan luces cercanas y se desvanecen solas.
 * Se coloca detrás del contenido de la pantalla (absolute, sin capturar
 * toques). El firmamento (T9) no la usa — ya es su propio cielo.
 */
export function AmbientSky({ density = 14 }: AmbientSkyProps) {
  const { width, height } = useWindowDimensions();
  const lights = useMemo(
    () => makeLights(width, height, density),
    [width, height, density]
  );
  const constellationPairs = useMemo(
    () => makeConstellationPairs(lights, width, height),
    [lights, width, height]
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
        {constellationPairs.map((pair, i) => (
          <ConstellationLine key={`line-${i}`} pair={pair} />
        ))}
        {lights.map((light, i) => (
          <FloatingLight key={i} light={light} />
        ))}
      </Canvas>
    </View>
  );
}
