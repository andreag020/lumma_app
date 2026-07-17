// Punto de entrada real de la app (ver "main" en package.json).
//
// El aviso de expo-notifications sobre push remoto en Expo Go ("Android
// Push notifications ... was removed from Expo Go") se dispara como
// efecto secundario al importar el módulo — muy temprano, antes de que un
// `LogBox.ignoreLogs` puesto dentro de app/_layout.tsx llegue siquiera a
// registrarse (los `import` de ese archivo, y todo lo que arranca detrás
// de `expo-router/entry`, se evalúan antes que su propio código). Por eso
// el filtro vive aquí, y `expo-router/entry` se carga con `require()`
// DESPUÉS (no como `import`, que quedaría izado por encima del filtro) —
// así queda registrado antes de que cualquier pantalla llegue a importar
// expo-notifications.
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  "'expo-notifications' functionality is not fully supported in Expo Go",
]);

require('expo-router/entry');
