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

/**
 * ⚠️ ID de prueba público de Google (el mismo que usan todos sus ejemplos
 * de AdMob) — sirve para desarrollar sin arriesgar la cuenta real, pero
 * hay que reemplazarlo por el ID de unidad de anuncio real de Lumma antes
 * de publicar. Ver también los `androidAppId`/`iosAppId` de prueba en
 * `app.json` (mismo reemplazo pendiente).
 */
const PRODUCTION_BANNER_AD_UNIT_ID = 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy';

export function getBannerAdUnitId(): string {
  return __DEV__ ? TestIds.ADAPTIVE_BANNER : PRODUCTION_BANNER_AD_UNIT_ID;
}

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

    await mobileAds().initialize();
    useAdsStore.getState().setCanShowAds(true);
  } catch (err) {
    console.warn('No se pudo inicializar los anuncios', err);
    useAdsStore.getState().setCanShowAds(false);
  }
}
