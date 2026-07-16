import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { getDb } from '../src/core/db/database';
import { seedContent, refreshRemoteContent } from '../src/services/contentService';
import { colors } from '../src/core/theme/theme';
import { fontAssets } from '../src/core/theme/fonts';

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
  const [dbReady, setDbReady] = useState(false);
  const [fontsLoaded] = useFonts(fontAssets);

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
        setDbReady(true);
      }
      // No bloquea el arranque: si hay red, trae lecturas nuevas de fondo;
      // si no, la app sigue con el contenido embebido/ya sincronizado.
      refreshRemoteContent();
    })();
  }, []);

  const ready = dbReady && fontsLoaded;

  if (!ready) {
    return (
      <GestureHandlerRootView style={styles.loading}>
        <ActivityIndicator color={colors.gold} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
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
