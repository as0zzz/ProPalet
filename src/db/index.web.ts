import LokiJSAdapter from "@nozbe/watermelondb/adapters/lokijs";
import { Database } from "@nozbe/watermelondb";

import { migrations } from "@/src/db/migrations";
import { schema } from "@/src/db/schema";
import { AppSetting } from "@/src/models/AppSetting";
import { AuditLog } from "@/src/models/AuditLog";
import { InventoryItem } from "@/src/models/InventoryItem";
import { LoadingReport } from "@/src/models/LoadingReport";
import { LoadingScheme } from "@/src/models/LoadingScheme";
import { PackageType } from "@/src/models/PackageType";
import { SchemeInventory } from "@/src/models/SchemeInventory";
import { SeedMeta } from "@/src/models/SeedMeta";
import { SyncQueue } from "@/src/models/SyncQueue";
import { Wagon } from "@/src/models/Wagon";

let databaseInstance: Database | null = null;

export function getDatabase(): Database {
  if (databaseInstance) {
    return databaseInstance;
  }

  const adapter = new LokiJSAdapter({
    dbName: "propalet-web",
    schema,
    migrations,
    useWebWorker: false,
    useIncrementalIndexedDB: true,
    onSetUpError: (error) => {
      console.error("WatermelonDB web setup error", error);
    },
  });

  databaseInstance = new Database({
    adapter,
    modelClasses: [
      Wagon,
      PackageType,
      LoadingScheme,
      InventoryItem,
      SchemeInventory,
      LoadingReport,
      AppSetting,
      SeedMeta,
      AuditLog,
      SyncQueue,
    ],
  });

  return databaseInstance;
}
