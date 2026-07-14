import { forwardRef } from 'react';
import { Pressable, type PressableProps, type GestureResponderEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * `Pressable` con un pequeño "respiro" de escala al tocar. Reservado para
 * acciones primarias (CTAs, selección de signo/mood) — no se usa en todo,
 * para que el gesto siga sintiéndose intencional.
 */
export const AnimatedPressable = forwardRef<
  React.ElementRef<typeof Pressable>,
  PressableProps
>(function AnimatedPressable({ style, onPressIn, onPressOut, ...rest }, ref) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn(e: GestureResponderEvent) {
    scale.value = withTiming(0.95, { duration: 110 });
    onPressIn?.(e);
  }

  function handlePressOut(e: GestureResponderEvent) {
    scale.value = withTiming(1, { duration: 160 });
    onPressOut?.(e);
  }

  return (
    <ReanimatedPressable
      ref={ref}
      style={[style, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...rest}
    />
  );
});
