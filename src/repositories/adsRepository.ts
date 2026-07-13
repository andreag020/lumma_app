import { getDb } from '../core/db/database';
import {
  adsConfigFromRow,
  adsConfigToRow,
  defaultAdsConfig,
  type AdsConfig,
  type AdsConfigRow,
} from '../models';

export async function getAdsConfig(): Promise<AdsConfig> {
  const db = await getDb();
  const row = await db.getFirstAsync<AdsConfigRow>(
    'SELECT * FROM ads_config WHERE id = 1'
  );
  return row ? adsConfigFromRow(row) : defaultAdsConfig;
}

export async function saveAdsConfig(config: AdsConfig): Promise<void> {
  const db = await getDb();
  const r = adsConfigToRow(config);
  await db.runAsync(
    `INSERT INTO ads_config (id, ads_removed, consent_status, last_consent_check)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       ads_removed = excluded.ads_removed,
       consent_status = excluded.consent_status,
       last_consent_check = excluded.last_consent_check`,
    [r.ads_removed, r.consent_status, r.last_consent_check]
  );
}
