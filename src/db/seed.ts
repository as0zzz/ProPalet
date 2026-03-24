import type { DemoSeedPayload } from "@/src/types/domain";
import { DEMO_SEED_VERSION } from "@/src/utils/constants";
import { inventoryItemsSeed, schemeInventorySeed } from "@/src/db/seedData/inventory";
import { loadingSchemesSeed } from "@/src/db/seedData/loadingSchemes";
import { packageTypesSeed } from "@/src/db/seedData/packageTypes";
import { wagonsSeed } from "@/src/db/seedData/wagons";

export const demoSeed: DemoSeedPayload = {
  seedVersion: DEMO_SEED_VERSION,
  wagons: wagonsSeed,
  packageTypes: packageTypesSeed,
  loadingSchemes: loadingSchemesSeed,
  inventoryItems: inventoryItemsSeed,
  schemeInventory: schemeInventorySeed,
};
