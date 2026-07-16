import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import mobileAds, { AdsConsent, TestIds } from 'react-native-google-mobile-ads';
import { getAdsConfig } from '../repositories/adsRepository';
import { useAdsStore } from '../stores/adsStore';

// Este módulo tiene código nativo (a diferencia del resto de Lumma), que
// Expo Go no incluye — solo funciona en un dev build o en la app
// publicada. En Expo Go, `initAds` no hace nada y `AdBanner` no renderiza
// nada, para no romper el resto de la app mientras se prueba ahí.
function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

// ID real de la unidad de anuncio banner de Lumma en AdMob (Android).
const PRODUCTION_BANNER_AD_UNIT_ID_ANDROID = 'ca-app-pub-2316901851284710/5928564773';

// ⚠️ Todavía no existe una app de Lumma para iOS en AdMob (solo se creó la
// de Android) — este sigue siendo el ID de prueba público de Google.
// Cuando crees la app de iOS en AdMob y su unidad de banner, reemplázalo
// aquí (y el `iosAppId` en app.json) antes de publicar en la App Store.
const PRODUCTION_BANNER_AD_UNIT_ID_IOS = 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy';

export function getBannerAdUnitId(): string {
  if (__DEV__) return TestIds.ADAPTIVE_BANNER;
  return Platform.OS === 'ios'
    ? PRODUCTION_BANNER_AD_UNIT_ID_IOS
    : PRODUCTION_BANNER_AD_UNIT_ID_ANDROID;
}

// Dispositivos de las personas que prueban builds de beta (Internal
// testing / TestFlight): siempre reciben anuncios de PRUEBA de Google, sin
// importar que el build ya no esté en modo desarrollo (__DEV__ es false en
// un build de EAS). Sin esto, tus testers verían y podrían tocar anuncios
// reales repetidamente, lo que AdMob puede marcar como "tráfico inválido".
//
// Cómo conseguir el ID de un dispositivo: corre el build una vez con el
// dispositivo conectado y revisa los logs nativos (Logcat en Android,
// consola de Xcode en iOS) — al iniciar, el SDK de Google imprime algo
// como "Use RequestConfiguration.Builder.setTestDeviceIds(Arrays.asList("XXXXX"))
// to get test ads on this device". Copia ese ID aquí.
const TEST_DEVICE_IDENTIFIERS: string[] = [];

/**
 * Prepara los anuncios al arrancar la app: recoge el consentimiento del
 * usuario (obligatorio en el Espacio Económico Europeo, política de
 * consentimiento de Google) y solo inicializa el SDK si el consentimiento
 * lo permite y la usuaria no tiene los anuncios desactivados
 * (`ads_config.ads_removed`). Nunca bloquea el arranque ni falla la app —
 * los anuncios son un extra, jamás un requisito para usar Lumma.
 */
export async function initAds(): Promise<void> {
  if (isExpoGo()) return;

  try {
    const { adsRemoved } = await getAdsConfig();
    if (adsRemoved) {
      useAdsStore.getState().setCanShowAds(false);
      return;
    }

    await AdsConsent.gatherConsent();
    const { canRequestAds } = await AdsConsent.getConsentInfo();
    if (!canRequestAds) {
      useAdsStore.getState().setCanShowAds(false);
      return;
    }

    if (TEST_DEVICE_IDENTIFIERS.length > 0) {
      await mobileAds().setRequestConfiguration({
        testDeviceIdentifiers: TEST_DEVICE_IDENTIFIERS,
      });
    }

    await mobileAds().initialize();
    useAdsStore.getState().setCanShowAds(true);
  } catch (err) {
    console.warn('No se pudo inicializar los anuncios', err);
    useAdsStore.getState().setCanShowAds(false);
  }
}
