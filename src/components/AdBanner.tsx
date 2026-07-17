import { View, StyleSheet } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { getBannerAdUnitId } from '../services/adsService';
import { useAdsStore } from '../stores/adsStore';
import { spacing } from '../core/theme/theme';

/**
 * Banner discreto para pantallas secundarias (nunca en Home, el ritual
 * principal). No renderiza nada hasta que `initAds()` confirme que hay
 * consentimiento y que la usuaria no tiene los anuncios desactivados, ni
 * tampoco en Expo Go (este módulo requiere un dev build).
 */
export function AdBanner() {
  const ready = useAdsStore((s) => s.ready);
  const canShowAds = useAdsStore((s) => s.canShowAds);
  const isExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  if (isExpoGo || !ready || !canShowAds) return null;

  return (
    <View style={styles.wrap}>
      <BannerAd
        unitId={getBannerAdUnitId()}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
});
