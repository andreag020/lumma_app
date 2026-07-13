import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../src/core/theme/theme';

/**
 * Pantalla de inicio (placeholder del Checkpoint A).
 * Demuestra el tema noche de Lumma. Las pantallas reales
 * (onboarding, home, registro, firmamento) llegan en las fases 1–2.
 */
export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.brand}>Lumma</Text>
        <Text style={styles.tagline}>tu paz, escrita en el cielo</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  brand: {
    ...typography.display,
    color: colors.ivory,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...typography.body,
    color: colors.lavender,
  },
});
