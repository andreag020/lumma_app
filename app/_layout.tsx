import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { getDb } from '../src/core/db/database';
import { seedContent, refreshRemoteContent } from '../src/services/contentService';
import { initAds } from '../src/services/adsService';
import { useThemeStore } from '../src/stores/themeStore';
import { useTheme } from '../src/core/theme/useTheme';
import { fontAssets } from '../src/core/theme/fonts';

// El aviso esperado y conocido de expo-notifications en Expo Go (Lumma
// solo usa notificaciones locales, no push remoto) se silencia en
// index.js, no aquí — necesita registrarse antes de que arranque
// expo-router/entry. Ver el comentario en ese archivo.

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [fontsLoaded] = useFonts(fontAssets);
  const { colors } = useTheme();

  useEffect(() => {
    // Abrir la base local, aplicar migraciones, sembrar el contenido
    // empaquetado y cargar el tema elegido antes de mostrar la app.
    (async () => {
      try {
        await getDb();
        await seedContent();
        await useThemeStore.getState().load();
      } catch (err) {
        console.error('No se pudo inicializar la app', err);
      } finally {
        setDbReady(true);
      }
      // No bloquea el arranque: si hay red, trae lecturas nuevas de fondo;
      // si no, la app sigue con el contenido embebido/ya sincronizado.
      refreshRemoteContent();
      // Recoge consentimiento e inicializa el SDK de anuncios (no hace
      // nada en Expo Go, ver adsService.ts). Tampoco bloquea el arranque.
      initAds();
    })();
  }, []);

  const ready = dbReady && fontsLoaded;

  if (!ready) {
    return (
      <GestureHandlerRootView
        style={[styles.loading, { backgroundColor: colors.background }]}
      >
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
  },
});
