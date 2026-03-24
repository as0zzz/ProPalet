import { useMemo } from "react";
import { Q } from "@nozbe/watermelondb";

import { useDatabase } from "@/src/db/hooks";
import { AppSetting } from "@/src/models/AppSetting";
import { SeedMeta } from "@/src/models/SeedMeta";
import { APP_SETTING_KEYS, DB_TABLES } from "@/src/utils/constants";
import { assignModelId, getNow } from "@/src/repositories/helpers";

export function useSettingsRepo() {
  const database = useDatabase();
  const settingsCollection = database.get<AppSetting>(DB_TABLES.appSettings);
  const seedMetaCollection = database.get<SeedMeta>(DB_TABLES.seedMeta);

  return useMemo(
    () => ({
    async getSetting(key: string): Promise<string | undefined> {
      const records = await settingsCollection.query(Q.where("key", key)).fetch();
      return records[0]?.value;
    },
    async setSetting(key: string, value: string): Promise<void> {
      await database.write(async () => {
        const records = await settingsCollection.query(Q.where("key", key)).fetch();
        const current = records[0];
        if (current) {
          await current.update((record) => {
            record.value = value;
            record.updatedAt = getNow();
          });
          return;
        }

        await settingsCollection.create((record) => {
          assignModelId(record, key);
          record.key = key;
          record.value = value;
          record.updatedAt = getNow();
        });
      });
    },
    async getProductionUiEnabled(): Promise<boolean> {
      const raw = await this.getSetting(APP_SETTING_KEYS.productionUiEnabled);
      return raw !== "false";
    },
    async setProductionUiEnabled(value: boolean): Promise<void> {
      await this.setSetting(APP_SETTING_KEYS.productionUiEnabled, String(value));
    },
    async getSeedVersion(): Promise<string | undefined> {
      const record = await seedMetaCollection.query(Q.sortBy("applied_at", Q.desc), Q.take(1)).fetch();
      return record[0]?.seedVersion;
    },
    async setSeedVersion(seedVersion: string, checksum?: string): Promise<void> {
      await database.write(async () => {
        const current = await seedMetaCollection.query(Q.sortBy("applied_at", Q.desc), Q.take(1)).fetch();
        if (current[0]) {
          await current[0].update((record) => {
            record.seedVersion = seedVersion;
            record.appliedAt = getNow();
            record.checksum = checksum;
          });
          return;
        }

        await seedMetaCollection.create((record) => {
          assignModelId(record, `seed-${seedVersion}`);
          record.seedVersion = seedVersion;
          record.appliedAt = getNow();
          record.checksum = checksum;
        });
      });
    },
    }),
    [database, seedMetaCollection, settingsCollection],
  );
}
