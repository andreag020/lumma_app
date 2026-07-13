import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, radius, typography } from '../src/core/theme/theme';

/**
 * Placeholder de la pantalla de registro de ánimo.
 * El registro real (color + etiqueta + nota, persistido en SQLite) es la
 * tarea T8 — todavía no implementada.
 */
export default function Mood() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.center}>
        <Text style={styles.title}>Tu firmamento espera</Text>
        <Text style={styles.body}>
          El registro de ánimo llega muy pronto: elegirás un color y una
          palabra para el día, y se sumará a tu firmamento personal.
        </Text>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>Volver</Text>
        </Pressable>
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
  title: {
    ...typography.title,
    color: colors.ivory,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  back: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  backText: {
    ...typography.body,
    color: colors.lavender,
  },
});
