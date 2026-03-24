import { useEffect, useState } from "react";

import { useDatabase } from "@/src/db/hooks";
import { useSettingsRepo } from "@/src/repositories/settingsRepo";
import { seedService } from "@/src/services/seedService";
import { useUiStore } from "@/src/state/uiStore";

export function useAppBootstrap() {
  const database = useDatabase();
  const settingsRepo = useSettingsRepo();
  const setProductionUiEnabled = useUiStore((state) => state.setProductionUiEnabled);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        setLoading(true);
        await seedService.bootstrap(database);
        const productionUiEnabled = await settingsRepo.getProductionUiEnabled();
        if (!active) {
          return;
        }
        setProductionUiEnabled(productionUiEnabled);
        setError(undefined);
      } catch (bootstrapError) {
        if (!active) {
          return;
        }
        setError(bootstrapError instanceof Error ? bootstrapError.message : "Не удалось инициализировать приложение.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [database, setProductionUiEnabled, settingsRepo]);

  return { loading, error };
}
