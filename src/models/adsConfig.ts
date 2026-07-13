/** Configuración de anuncios y consentimiento. */
export interface AdsConfig {
  adsRemoved: boolean;
  consentStatus: 'unknown' | 'granted' | 'denied';
  lastConsentCheck: string | null; // ISO datetime
}

export interface AdsConfigRow {
  id: number; // fila única (id = 1)
  ads_removed: number; // 0 | 1
  consent_status: string;
  last_consent_check: string | null;
}

export function adsConfigToRow(c: AdsConfig): AdsConfigRow {
  return {
    id: 1,
    ads_removed: c.adsRemoved ? 1 : 0,
    consent_status: c.consentStatus,
    last_consent_check: c.lastConsentCheck,
  };
}

export function adsConfigFromRow(r: AdsConfigRow): AdsConfig {
  return {
    adsRemoved: r.ads_removed === 1,
    consentStatus: r.consent_status as AdsConfig['consentStatus'],
    lastConsentCheck: r.last_consent_check,
  };
}

export const defaultAdsConfig: AdsConfig = {
  adsRemoved: false,
  consentStatus: 'unknown',
  lastConsentCheck: null,
};
