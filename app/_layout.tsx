import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getDb } from '../src/core/db/database';
import { colors } from '../src/core/theme/theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Abrir la base local y aplicar migraciones antes de mostrar la app.
    getDb()
      .then(() => setReady(true))
      .catch((err) => {
        console.error('No se pudo inicializar la base de datos', err);
        setReady(true);
      });
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
