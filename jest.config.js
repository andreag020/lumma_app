/**
 * Configuración de pruebas para la lógica pura (modelos, utilidades).
 * Usa ts-jest en entorno Node — no necesita el runtime de React Native.
 *
 * Las pruebas de componentes (widgets) adoptarán el preset `jest-expo`
 * en la fase 1, cuando existan pantallas que renderizar.
 */
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts', '**/test/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          types: ['jest'],
        },
      },
    ],
  },
};
