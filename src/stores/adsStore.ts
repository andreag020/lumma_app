import { create } from 'zustand';

interface AdsState {
  /** true una vez que `initAds()` terminó de decidir si se pueden pedir
   * anuncios (consentimiento + `ads_removed`). Antes de eso, `AdBanner` no
   * intenta renderizar nada, para no pedir un anuncio sin permiso. */
  ready: boolean;
  canShowAds: boolean;
  setCanShowAds: (canShowAds: boolean) => void;
}

export const useAdsStore = create<AdsState>((set) => ({
  ready: false,
  canShowAds: false,
  setCanShowAds: (canShowAds) => set({ ready: true, canShowAds }),
}));
