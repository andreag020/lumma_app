import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getDb } from '../src/core/db/database';
import { seedContent } from '../src/services/contentService';
import { colors } from '../src/core/theme/theme';

// Aviso esperado y conocido en Expo Go SDK 54: expo-notifications intenta
// registrar automáticamente un token de push remoto al importarse, algo
// que Expo Go ya no soporta desde el SDK 53. No nos afecta — Lumma solo
// usa notificaciones locales — y no es un error real, así que se silencia
// para no confundir con problemas de verdad durante el desarrollo.
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  "'expo-notifications' functionality is not fully supported in Expo Go",
]);

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Abrir la base local, aplicar migraciones y sembrar el contenido
    // empaquetado antes de mostrar la app.
    (async () => {
      try {
        await getDb();
        await seedContent();
      } catch (err) {
        console.error('No se pudo inicializar la app', err);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
