import { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Line,
  Oval,
  Path,
  Group,
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
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../core/theme/useTheme';
import type { ParticleStyle } from '../core/theme/theme';

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
  /** Vuelta completa de giro — usada por 'petal' y 'snowflake'. */
  rotationDuration: number;
  rotationDirection: 1 | -1;
  /** Aleteo rápido — usado por 'firefly'. */
  wingFlapDuration: number;
}

function makeLights(
  width: number,
  height: number,
  count: number,
  lightColors: string[]
): LightSpec[] {
  const lights: LightSpec[] = [];
  for (let i = 0; i < count; i++) {
    lights.push({
      baseX: Math.random() * width,
      baseY: Math.random() * height,
      driftX: 24 + Math.random() * 32,
      driftY: 18 + Math.random() * 26,
      radius: 1.3 + Math.random() * 2,
      color: lightColors[i % lightColors.length],
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
      rotationDuration: 7000 + Math.random() * 6000,
      rotationDirection: Math.random() < 0.5 ? 1 : -1,
      // Antes 130–240ms: ese ritmo tan alto (varios ciclos por segundo,
      // sostenido, en hasta 14 luciérnagas a la vez) es la animación más
      // rápida de todo el componente por lejos y generaba parpadeos tipo
      // glitch tras un minuto o más de uso sostenido — más lento pero
      // sigue leyéndose como aleteo.
      wingFlapDuration: 320 + Math.random() * 180,
    });
  }
  return lights;
}

/** Contorno de un pétalo (forma de hoja/vesica), en espacio local -1..1,
 * escalado luego con `scale` según el radio de cada partícula. */
const PETAL_PATH =
  'M 0 -1 C 0.55 -0.6 0.55 0.6 0 1 C -0.55 0.6 -0.55 -0.6 0 -1 Z';

function FloatingLight({
  light,
  coreColor,
  particleStyle,
}: {
  light: LightSpec;
  coreColor: string;
  particleStyle: ParticleStyle;
}) {
  const progressX = useSharedValue(0);
  const progressY = useSharedValue(0);
  const twinkle = useSharedValue(0);
  const spin = useSharedValue(0);
  const flap = useSharedValue(0);

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

    if (particleStyle === 'firefly') {
      // Destello rápido seguido de una pausa oscura más larga — el
      // parpadeo característico de una luciérnaga, no un titileo suave.
      twinkle.value = withDelay(
        light.twinkleDelay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }),
            withTiming(0.1, { duration: 900, easing: Easing.in(Easing.quad) }),
            withTiming(0.05, { duration: light.twinkleDuration })
          ),
          -1,
          false
        )
      );
      flap.value = withRepeat(
        withTiming(1, {
          duration: light.wingFlapDuration,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true
      );
    } else {
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
    }

    if (particleStyle === 'petal' || particleStyle === 'snowflake') {
      spin.value = withRepeat(
        withTiming(1, { duration: light.rotationDuration, easing: Easing.linear }),
        -1,
        false
      );
    }
    // Cada luz anima una sola vez al montar; no depende de props que cambien.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cx = useDerivedValue(() => light.baseX + progressX.value * light.driftX);
  const cy = useDerivedValue(() => light.baseY - progressY.value * light.driftY);
  // El titileo domina la intensidad — desplazamiento y brillo ya no están
  // atados al mismo reloj, así que la luz parpadea aunque esté quieta.
  // Luciérnagas y pétalos parten de un piso más alto: deben notarse
  // incluso en el valle del titileo, no solo en el pico.
  const boosted = particleStyle === 'firefly' || particleStyle === 'petal';
  const haloFloor = boosted ? 0.34 : 0.22;
  const haloRange = boosted ? 0.6 : 0.58;
  const coreFloor = boosted ? 0.62 : 0.5;
  const coreRange = boosted ? 0.38 : 0.5;
  const haloOpacity = useDerivedValue(() => haloFloor + twinkle.value * haloRange);
  const coreOpacity = useDerivedValue(() => coreFloor + twinkle.value * coreRange);
  const rotation = useDerivedValue(
    () => spin.value * Math.PI * 2 * light.rotationDirection
  );
  const wingAngle = useDerivedValue(() => (flap.value - 0.5) * 0.9);

  const groupTransform = useDerivedValue(() => [
    { translateX: cx.value },
    { translateY: cy.value },
  ]);
  const petalTransform = useDerivedValue(() => [{ rotate: rotation.value }]);
  const snowflakeTransform = useDerivedValue(() => [{ rotate: rotation.value }]);
  // Alas cortas y redondeadas (óvalos), con bisagra en el punto donde
  // tocan el cuerpo — no líneas finas. En reposo quedan entreabiertas
  // hacia atrás; el aleteo las abre y cierra sobre ese mismo punto.
  const wingWidth = light.radius * 1.5;
  const wingHeight = light.radius * 1.05;
  const wingRestAngle = 0.4;
  const leftWingTransform = useDerivedValue(() => [
    { rotate: -wingRestAngle - wingAngle.value },
  ]);
  const rightWingTransform = useDerivedValue(() => [
    { rotate: wingRestAngle + wingAngle.value },
  ]);

  if (particleStyle === 'firefly') {
    return (
      <Group transform={groupTransform}>
        {/* Halo cálido, notablemente más amplio que el de una estrella común. */}
        <Circle cx={0} cy={0} r={light.radius * 1.7} color={light.color} opacity={haloOpacity}>
          <BlurMask blur={light.radius * 2.4} style="normal" />
        </Circle>
        {/* Alas cortas y redondeadas que aletean desde el cuerpo. Sin
            BlurMask propio: es la pieza que más rota por segundo, y un
            blur recalculado a ese ritmo era el principal costo detrás
            del parpadeo tipo glitch tras un rato de uso. */}
        <Group transform={leftWingTransform}>
          <Oval
            x={-wingWidth}
            y={-wingHeight / 2}
            width={wingWidth}
            height={wingHeight}
            color={coreColor}
            opacity={0.45}
          />
        </Group>
        <Group transform={rightWingTransform}>
          <Oval
            x={0}
            y={-wingHeight / 2}
            width={wingWidth}
            height={wingHeight}
            color={coreColor}
            opacity={0.45}
          />
        </Group>
        {/* Núcleo: el destello real de la luciérnaga. */}
        <Circle cx={0} cy={0} r={light.radius * 0.55} color={coreColor} opacity={coreOpacity}>
          <BlurMask blur={0.5} style="normal" />
        </Circle>
      </Group>
    );
  }

  if (particleStyle === 'petal') {
    return (
      <Group transform={groupTransform}>
        <Circle cx={0} cy={0} r={light.radius * 1.3} color={light.color} opacity={haloOpacity}>
          <BlurMask blur={light.radius * 1.8} style="normal" />
        </Circle>
        <Group transform={petalTransform}>
          <Path
            path={PETAL_PATH}
            color={light.color}
            opacity={coreOpacity}
            transform={[{ scale: light.radius * 2 }]}
          >
            <BlurMask blur={0.4} style="normal" />
          </Path>
        </Group>
      </Group>
    );
  }

  if (particleStyle === 'snowflake') {
    const arm = light.radius * 2.8;
    // Ramas cortas cerca de cada punta, como un copo de nieve dibujado a
    // mano — no solo un asterisco de 6 puntas.
    const branchBaseT = 0.72;
    const branchLength = arm * 0.4;
    const branchSpread = (30 * Math.PI) / 180;
    const spokeAngles = [0, 60, 120, 180, 240, 300];
    return (
      <Group transform={groupTransform}>
        <Circle cx={0} cy={0} r={light.radius * 1.1} color={light.color} opacity={haloOpacity}>
          <BlurMask blur={light.radius * 2} style="normal" />
        </Circle>
        <Group transform={snowflakeTransform}>
          {[0, 60, 120].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const dx = Math.cos(rad) * arm;
            const dy = Math.sin(rad) * arm;
            return (
              <Line
                key={`main-${deg}`}
                p1={vec(-dx, -dy)}
                p2={vec(dx, dy)}
                color={coreColor}
                opacity={0.8}
                strokeWidth={0.75}
              />
            );
          })}
          {spokeAngles.map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const base = vec(
              Math.cos(rad) * arm * branchBaseT,
              Math.sin(rad) * arm * branchBaseT
            );
            const branch1 = vec(
              base.x + Math.cos(rad + branchSpread) * branchLength,
              base.y + Math.sin(rad + branchSpread) * branchLength
            );
            const branch2 = vec(
              base.x + Math.cos(rad - branchSpread) * branchLength,
              base.y + Math.sin(rad - branchSpread) * branchLength
            );
            return (
              <Group key={`branch-${deg}`}>
                <Line p1={base} p2={branch1} color={coreColor} opacity={0.6} strokeWidth={0.55} />
                <Line p1={base} p2={branch2} color={coreColor} opacity={0.6} strokeWidth={0.55} />
              </Group>
            );
          })}
        </Group>
        <Circle cx={0} cy={0} r={light.radius * 0.32} color={coreColor} opacity={coreOpacity}>
          <BlurMask blur={0.4} style="normal" />
        </Circle>
      </Group>
    );
  }

  // 'star' (tema por defecto): halo + núcleo, sin forma adicional.
  return (
    <Group transform={groupTransform}>
      <Circle cx={0} cy={0} r={light.radius} color={light.color} opacity={haloOpacity}>
        <BlurMask blur={light.radius * 1.8} style="normal" />
      </Circle>
      <Circle cx={0} cy={0} r={light.radius * 0.4} color={coreColor} opacity={coreOpacity}>
        <BlurMask blur={0.5} style="normal" />
      </Circle>
    </Group>
  );
}

interface ConstellationPoint {
  dx: number;
  dy: number;
}

interface ConstellationSpec {
  centerX: number;
  centerY: number;
  points: ConstellationPoint[];
  driftX: number;
  driftY: number;
  driftDurationX: number;
  driftDurationY: number;
}

/** Una constelación nueva: entre 1 y 4 puntos encadenados cerca uno del
 * otro (siempre conectados por al menos un camino), en una posición
 * aleatoria de la pantalla. */
function makeConstellationSpec(width: number, height: number): ConstellationSpec {
  const pointCount = 1 + Math.floor(Math.random() * 4); // 1..4
  const margin = 50;
  const centerX = margin + Math.random() * Math.max(1, width - margin * 2);
  const centerY = margin + Math.random() * Math.max(1, height - margin * 2);

  const points: ConstellationPoint[] = [{ dx: 0, dy: 0 }];
  for (let i = 1; i < pointCount; i++) {
    const prev = points[i - 1];
    const angle = Math.random() * Math.PI * 2;
    const dist = 22 + Math.random() * 34;
    points.push({
      dx: prev.dx + Math.cos(angle) * dist,
      dy: prev.dy + Math.sin(angle) * dist,
    });
  }

  return {
    centerX,
    centerY,
    points,
    driftX: 8 + Math.random() * 16,
    driftY: 6 + Math.random() * 12,
    driftDurationX: 5000 + Math.random() * 3500,
    driftDurationY: 5800 + Math.random() * 3800,
  };
}

/**
 * Un grupo de 1–4 puntos, siempre conectados entre sí, que aparece en una
 * posición aleatoria, se mueve como un solo cuerpo (conserva su forma) y
 * se desvanece — al terminar su ciclo, avisa al padre para que aparezca
 * otra constelación distinta en otro lugar.
 */
function ConstellationGroup({
  width,
  height,
  onCycleEnd,
  lineColor,
  pointColor,
}: {
  width: number;
  height: number;
  onCycleEnd: () => void;
  lineColor: string;
  pointColor: string;
}) {
  const spec = useMemo(() => makeConstellationSpec(width, height), [width, height]);
  const opacity = useSharedValue(0);
  const driftProgressX = useSharedValue(0);
  const driftProgressY = useSharedValue(0);

  useEffect(() => {
    driftProgressX.value = withRepeat(
      withTiming(1, { duration: spec.driftDurationX, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    driftProgressY.value = withRepeat(
      withTiming(1, { duration: spec.driftDurationY, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    const fadeIn = 1800 + Math.random() * 1200;
    const hold = 2400 + Math.random() * 2400;
    const fadeOut = 2000 + Math.random() * 1400;
    const startDelay = Math.random() * 3000;

    opacity.value = withDelay(
      startDelay,
      withSequence(
        withTiming(1, { duration: fadeIn, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: hold }),
        withTiming(0, { duration: fadeOut, easing: Easing.in(Easing.quad) }, (finished) => {
          if (finished) runOnJS(onCycleEnd)();
        })
      )
    );
    // Cada instancia vive un solo ciclo (aparece → se sostiene →
    // desaparece); el padre la reemplaza por una nueva al terminar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const transform = useDerivedValue(() => [
    { translateX: spec.centerX + driftProgressX.value * spec.driftX },
    { translateY: spec.centerY - driftProgressY.value * spec.driftY },
  ]);
  const groupOpacity = useDerivedValue(() => opacity.value * 0.55);

  return (
    <Group transform={transform} opacity={groupOpacity}>
      {spec.points.slice(1).map((p, i) => (
        <Line
          key={`seg-${i}`}
          p1={vec(spec.points[i].dx, spec.points[i].dy)}
          p2={vec(p.dx, p.dy)}
          color={lineColor}
          strokeWidth={0.7}
        />
      ))}
      {spec.points.map((p, i) => (
        <Circle key={`pt-${i}`} cx={p.dx} cy={p.dy} r={1.7} color={pointColor}>
          <BlurMask blur={1.1} style="normal" />
        </Circle>
      ))}
    </Group>
  );
}

// Constelaciones activas al mismo tiempo: entre 2 y 4, para que el efecto
// siga siendo discreto y variable — nunca menos de dos a la vez, nunca
// más de cuatro para no sentirse como una lluvia constante.
const MIN_CONSTELLATIONS = 2;
const MAX_CONSTELLATIONS = 4;

function randomSlotCount(): number {
  return (
    MIN_CONSTELLATIONS +
    Math.floor(Math.random() * (MAX_CONSTELLATIONS - MIN_CONSTELLATIONS + 1))
  );
}

function makeSlotKeys(): number[] {
  return Array.from({ length: randomSlotCount() }, () => Math.random());
}

interface AmbientSkyProps {
  /** Cantidad de luces flotantes. Discreta a propósito — es ambiente, no protagonista. */
  density?: number;
}

/**
 * Fondo ambiental decorativo: degradado nocturno sutil + luces flotantes
 * tipo luciérnaga/estrella que titilan de forma independiente + pequeñas
 * constelaciones (1–4 puntos siempre conectados) que aparecen en
 * posiciones aleatorias, se mueven juntas y se desvanecen para dar paso a
 * otras. Se coloca detrás del contenido de la pantalla (absolute, sin
 * capturar toques). El firmamento (T9) no la usa — ya es su propio cielo.
 */
export function AmbientSky({ density = 14 }: AmbientSkyProps) {
  const { width, height } = useWindowDimensions();
  const { colors, theme } = useTheme();
  // Solo acentos de luz de la paleta del tema activo — nunca colores nuevos.
  const lightColors = useMemo(
    () => [colors.gold, colors.lavender, colors.lime, colors.ivory],
    [colors]
  );
  const lights = useMemo(
    () => makeLights(width, height, density, lightColors),
    [width, height, density, lightColors]
  );
  const [slotKeys, setSlotKeys] = useState<number[]>(makeSlotKeys);

  function respawnSlot(index: number) {
    setSlotKeys((prev) => {
      const next = [...prev];
      next[index] = Math.random();
      return next;
    });
  }

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
        {slotKeys.map((key, i) => (
          <ConstellationGroup
            key={key}
            width={width}
            height={height}
            onCycleEnd={() => respawnSlot(i)}
            lineColor={colors.constellationLine}
            pointColor={colors.ivory}
          />
        ))}
        {lights.map((light, i) => (
          <FloatingLight
            key={i}
            light={light}
            coreColor={colors.ivory}
            particleStyle={theme.particleStyle}
          />
        ))}
      </Canvas>
    </View>
  );
}
