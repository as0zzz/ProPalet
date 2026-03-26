import { Database, Model, Q } from "@nozbe/watermelondb";

import { demoSeed } from "@/src/db/seed";
import { AppSetting } from "@/src/models/AppSetting";
import { InventoryItem } from "@/src/models/InventoryItem";
import { LoadingScheme } from "@/src/models/LoadingScheme";
import { PackageType } from "@/src/models/PackageType";
import { SchemeInventory } from "@/src/models/SchemeInventory";
import { SeedMeta } from "@/src/models/SeedMeta";
import { Wagon } from "@/src/models/Wagon";
import { exportService } from "@/src/services/exportService";
import type {
  InventoryItemRecord,
  LoadingSchemeTierRecord,
  PackageTypeRecord,
  SchemeInventoryRecord,
  WagonRecord,
} from "@/src/types/domain";
import { APP_SETTING_KEYS, DB_TABLES } from "@/src/utils/constants";
import { normalizeSearchTerm, buildPackageTypeLabel } from "@/src/utils/search";

function setId(model: Model, id: string) {
  (model as Model & { _raw: { id: string } })._raw.id = id;
}

async function upsertSeedMeta(database: Database, seedVersion: string): Promise<void> {
  const collection = database.get<SeedMeta>(DB_TABLES.seedMeta);
  const current = await collection.query().fetch();
  if (current[0]) {
    await current[0].update((record) => {
      record.seedVersion = seedVersion;
      record.appliedAt = Date.now();
    });
    return;
  }

  await collection.create((record) => {
    setId(record, `seed-${seedVersion}`);
    record.seedVersion = seedVersion;
    record.appliedAt = Date.now();
  });
}

async function upsertSetting(database: Database, key: string, value: string): Promise<void> {
  const collection = database.get<AppSetting>(DB_TABLES.appSettings);
  const current = await collection.query().fetch();
  const record = current.find((item) => item.key === key);
  if (record) {
    await record.update((item) => {
      item.value = value;
      item.updatedAt = Date.now();
    });
    return;
  }

  await collection.create((item) => {
    setId(item, key);
    item.key = key;
    item.value = value;
    item.updatedAt = Date.now();
  });
}

async function wipeCollection<T extends Model>(database: Database, table: string): Promise<void> {
  const collection = database.get<T>(table);
  const records = await collection.query().fetch();
  if (!records.length) {
    return;
  }
  await database.batch(...records.map((record) => record.prepareDestroyPermanently()));
}

function mapWagonRecord(record: Wagon): WagonRecord {
  return {
    id: record.id,
    name: record.name,
    code: record.code,
    description: record.description,
    capacityKg: record.capacityKg,
    innerLengthMm: record.innerLengthMm,
    innerWidthMm: record.innerWidthMm,
    innerHeightMm: record.innerHeightMm,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    isDeleted: record.isDeleted,
    syncStatus: record.syncState as WagonRecord["syncStatus"],
    version: record.version,
  };
}

function mapPackageTypeRecord(record: PackageType): PackageTypeRecord {
  return {
    id: record.id,
    packageTypeNumber: record.packageTypeNumber,
    constructionVariant: record.constructionVariant,
    nominalIngotMassKg: record.nominalIngotMassKg,
    ingotHeightMm: record.ingotHeightMm,
    packageDimensions: record.packageDimensions,
    legHeightMm: record.legHeightMm,
    legBaseMm: record.legBaseMm,
    nominalPackageMassKg: record.nominalPackageMassKg,
    packageMassDeviationKg: record.packageMassDeviationKg,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    isDeleted: record.isDeleted,
    syncStatus: record.syncState as PackageTypeRecord["syncStatus"],
    version: record.version,
  };
}

function mapInventoryItemRecord(record: InventoryItem): InventoryItemRecord {
  return {
    id: record.id,
    name: record.name,
    quantity: record.quantity,
    configuration: record.configuration,
    imageKey: record.imageKey,
    unitOfMeasure: record.unitOfMeasure,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    isDeleted: record.isDeleted,
    syncStatus: record.syncState as InventoryItemRecord["syncStatus"],
    version: record.version,
  };
}

function mapLoadingSchemeRecord(record: LoadingScheme): LoadingSchemeTierRecord {
  return {
    id: record.id,
    groupKey: record.groupKey,
    name: record.name,
    description: record.description,
    imageKey: record.imageKey,
    tiersCount: record.tiersCount,
    tierOrderNumber: record.tierOrderNumber,
    wagonId: record.wagonId,
    packageTypeId: record.packageTypeId,
    instructionText: record.instructionText,
    tierNote: record.tierNote,
    isActive: record.isActive,
    version: record.version,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    isDeleted: record.isDeleted,
    syncStatus: record.syncState as LoadingSchemeTierRecord["syncStatus"],
  };
}

function mapSchemeInventoryRecord(record: SchemeInventory): SchemeInventoryRecord {
  return {
    id: record.id,
    loadingSchemeId: record.loadingSchemeId,
    inventoryItemId: record.inventoryItemId,
    unitsCount: record.unitsCount,
    note: record.note,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function formatVersionDate(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function formatFileStamp(date: Date): string {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(date.getSeconds()).padStart(2, "0")}`;
}

function buildSeedFile<T>(typeName: string, exportName: string, records: T[]): string {
  return `import type { ${typeName} } from "@/src/types/domain";\n\n// Generated from the current local database via admin export.\nexport const ${exportName}: ${typeName}[] = ${JSON.stringify(records, null, 2)};\n`;
}

function buildInventorySeedFile(inventoryItems: InventoryItemRecord[], schemeInventory: SchemeInventoryRecord[]): string {
  return `import type { InventoryItemRecord, SchemeInventoryRecord } from "@/src/types/domain";\n\n// Generated from the current local database via admin export.\nexport const inventoryItemsSeed: InventoryItemRecord[] = ${JSON.stringify(inventoryItems, null, 2)};\n\nexport const schemeInventorySeed: SchemeInventoryRecord[] = ${JSON.stringify(schemeInventory, null, 2)};\n`;
}

export const seedService = {
  async applySeed(database: Database): Promise<void> {
    await database.write(async () => {
      const wagonsCollection = database.get<Wagon>(DB_TABLES.wagons);
      const packageTypesCollection = database.get<PackageType>(DB_TABLES.packageTypes);
      const schemesCollection = database.get<LoadingScheme>(DB_TABLES.loadingSchemes);
      const inventoryCollection = database.get<InventoryItem>(DB_TABLES.inventoryItems);
      const relationsCollection = database.get<SchemeInventory>(DB_TABLES.schemeInventories);

      for (const wagon of demoSeed.wagons) {
        const existing = await wagonsCollection.query().fetch();
        const current = existing.find((item) => item.id === wagon.id);
        if (current) {
          await current.update((record) => {
            record.name = wagon.name;
            record.nameSearch = normalizeSearchTerm(wagon.name);
            record.code = wagon.code;
            record.description = wagon.description;
            record.capacityKg = wagon.capacityKg;
            record.innerLengthMm = wagon.innerLengthMm;
            record.innerWidthMm = wagon.innerWidthMm;
            record.innerHeightMm = wagon.innerHeightMm;
            record.updatedAt = wagon.updatedAt;
          });
        } else {
          await wagonsCollection.create((record) => {
            setId(record, wagon.id);
            record.name = wagon.name;
            record.nameSearch = normalizeSearchTerm(wagon.name);
            record.code = wagon.code;
            record.description = wagon.description;
            record.capacityKg = wagon.capacityKg;
            record.innerLengthMm = wagon.innerLengthMm;
            record.innerWidthMm = wagon.innerWidthMm;
            record.innerHeightMm = wagon.innerHeightMm;
            record.createdAt = wagon.createdAt;
            record.updatedAt = wagon.updatedAt;
            record.isDeleted = false;
            record.syncState = wagon.syncStatus;
            record.version = wagon.version;
          });
        }
      }

      for (const packageType of demoSeed.packageTypes) {
        const existing = await packageTypesCollection.query().fetch();
        const current = existing.find((item) => item.id === packageType.id);
        if (current) {
          await current.update((record) => {
            record.packageTypeNumber = packageType.packageTypeNumber;
            record.constructionVariant = packageType.constructionVariant;
            record.nominalIngotMassKg = packageType.nominalIngotMassKg;
            record.ingotHeightMm = packageType.ingotHeightMm;
            record.packageDimensions = packageType.packageDimensions;
            record.legHeightMm = packageType.legHeightMm;
            record.legBaseMm = packageType.legBaseMm;
            record.nominalPackageMassKg = packageType.nominalPackageMassKg;
            record.packageMassDeviationKg = packageType.packageMassDeviationKg;
            record.searchLabel = normalizeSearchTerm(
              `${buildPackageTypeLabel(packageType.packageTypeNumber, packageType.constructionVariant)} ${packageType.packageDimensions}`,
            );
            record.updatedAt = packageType.updatedAt;
          });
        } else {
          await packageTypesCollection.create((record) => {
            setId(record, packageType.id);
            record.packageTypeNumber = packageType.packageTypeNumber;
            record.constructionVariant = packageType.constructionVariant;
            record.nominalIngotMassKg = packageType.nominalIngotMassKg;
            record.ingotHeightMm = packageType.ingotHeightMm;
            record.packageDimensions = packageType.packageDimensions;
            record.legHeightMm = packageType.legHeightMm;
            record.legBaseMm = packageType.legBaseMm;
            record.nominalPackageMassKg = packageType.nominalPackageMassKg;
            record.packageMassDeviationKg = packageType.packageMassDeviationKg;
            record.searchLabel = normalizeSearchTerm(
              `${buildPackageTypeLabel(packageType.packageTypeNumber, packageType.constructionVariant)} ${packageType.packageDimensions}`,
            );
            record.createdAt = packageType.createdAt;
            record.updatedAt = packageType.updatedAt;
            record.isDeleted = false;
            record.syncState = packageType.syncStatus;
            record.version = packageType.version;
          });
        }
      }

      for (const inventory of demoSeed.inventoryItems) {
        const existing = await inventoryCollection.query().fetch();
        const current = existing.find((item) => item.id === inventory.id);
        if (current) {
          await current.update((record) => {
            record.name = inventory.name;
            record.nameSearch = normalizeSearchTerm(inventory.name);
            record.quantity = inventory.quantity;
            record.configuration = inventory.configuration;
            record.imageKey = inventory.imageKey;
            record.unitOfMeasure = inventory.unitOfMeasure;
            record.updatedAt = inventory.updatedAt;
          });
        } else {
          await inventoryCollection.create((record) => {
            setId(record, inventory.id);
            record.name = inventory.name;
            record.nameSearch = normalizeSearchTerm(inventory.name);
            record.quantity = inventory.quantity;
            record.configuration = inventory.configuration;
            record.imageKey = inventory.imageKey;
            record.unitOfMeasure = inventory.unitOfMeasure;
            record.createdAt = inventory.createdAt;
            record.updatedAt = inventory.updatedAt;
            record.isDeleted = false;
            record.syncState = inventory.syncStatus;
            record.version = inventory.version;
          });
        }
      }

      for (const scheme of demoSeed.loadingSchemes) {
        const existing = await schemesCollection.query().fetch();
        const current = existing.find((item) => item.id === scheme.id);
        if (current) {
          await current.update((record) => {
            record.groupKey = scheme.groupKey;
            record.name = scheme.name;
            record.description = scheme.description;
            record.imageKey = scheme.imageKey;
            record.tiersCount = scheme.tiersCount;
            record.tierOrderNumber = scheme.tierOrderNumber;
            record.wagonId = scheme.wagonId;
            record.packageTypeId = scheme.packageTypeId;
            record.instructionText = scheme.instructionText;
            record.tierNote = scheme.tierNote;
            record.isActive = scheme.isActive;
            record.updatedAt = scheme.updatedAt;
          });
        } else {
          await schemesCollection.create((record) => {
            setId(record, scheme.id);
            record.groupKey = scheme.groupKey;
            record.name = scheme.name;
            record.description = scheme.description;
            record.imageKey = scheme.imageKey;
            record.tiersCount = scheme.tiersCount;
            record.tierOrderNumber = scheme.tierOrderNumber;
            record.wagonId = scheme.wagonId;
            record.packageTypeId = scheme.packageTypeId;
            record.instructionText = scheme.instructionText;
            record.tierNote = scheme.tierNote;
            record.isActive = scheme.isActive;
            record.version = scheme.version;
            record.createdAt = scheme.createdAt;
            record.updatedAt = scheme.updatedAt;
            record.isDeleted = false;
            record.syncState = scheme.syncStatus;
          });
        }
      }

      for (const relation of demoSeed.schemeInventory) {
        const existing = await relationsCollection.query().fetch();
        const current = existing.find((item) => item.id === relation.id);
        if (current) {
          await current.update((record) => {
            record.loadingSchemeId = relation.loadingSchemeId;
            record.inventoryItemId = relation.inventoryItemId;
            record.unitsCount = relation.unitsCount;
            record.note = relation.note;
            record.updatedAt = relation.updatedAt;
          });
        } else {
          await relationsCollection.create((record) => {
            setId(record, relation.id);
            record.loadingSchemeId = relation.loadingSchemeId;
            record.inventoryItemId = relation.inventoryItemId;
            record.unitsCount = relation.unitsCount;
            record.note = relation.note;
            record.createdAt = relation.createdAt;
            record.updatedAt = relation.updatedAt;
          });
        }
      }

      await upsertSeedMeta(database, demoSeed.seedVersion);
      await upsertSetting(database, APP_SETTING_KEYS.seedVersion, demoSeed.seedVersion);
      await upsertSetting(database, APP_SETTING_KEYS.initializedAt, String(Date.now()));
      await upsertSetting(database, APP_SETTING_KEYS.productionUiEnabled, "true");
    });
  },
  async bootstrap(database: Database): Promise<void> {
    const seedMetaCollection = database.get<SeedMeta>(DB_TABLES.seedMeta);
    const meta = await seedMetaCollection.query().fetch();
    const currentVersion = meta[0]?.seedVersion;
    if (currentVersion !== demoSeed.seedVersion) {
      await this.applySeed(database);
    }
  },
  async resetToDemo(database: Database): Promise<void> {
    await database.write(async () => {
      await wipeCollection(database, DB_TABLES.schemeInventories);
      await wipeCollection(database, DB_TABLES.loadingReports);
      await wipeCollection(database, DB_TABLES.loadingSchemes);
      await wipeCollection(database, DB_TABLES.inventoryItems);
      await wipeCollection(database, DB_TABLES.packageTypes);
      await wipeCollection(database, DB_TABLES.wagons);
      await wipeCollection(database, DB_TABLES.seedMeta);
    });
    await this.applySeed(database);
  },
  async exportCurrentSeedData(database: Database): Promise<{ directoryName: string; filePaths: string[]; recommendedSeedVersion: string }> {
    const wagonsCollection = database.get<Wagon>(DB_TABLES.wagons);
    const packageTypesCollection = database.get<PackageType>(DB_TABLES.packageTypes);
    const schemesCollection = database.get<LoadingScheme>(DB_TABLES.loadingSchemes);
    const inventoryCollection = database.get<InventoryItem>(DB_TABLES.inventoryItems);
    const relationsCollection = database.get<SchemeInventory>(DB_TABLES.schemeInventories);

    const wagons = (await wagonsCollection.query(Q.where("is_deleted", false), Q.sortBy("name", Q.asc)).fetch()).map(mapWagonRecord);
    const packageTypes = (
      await packageTypesCollection.query(Q.where("is_deleted", false), Q.sortBy("package_type_number", Q.asc), Q.sortBy("construction_variant", Q.asc)).fetch()
    ).map(mapPackageTypeRecord);
    const loadingSchemes = (
      await schemesCollection.query(Q.where("is_deleted", false), Q.sortBy("group_key", Q.asc), Q.sortBy("tier_order_number", Q.asc)).fetch()
    ).map(mapLoadingSchemeRecord);
    const inventoryItems = (
      await inventoryCollection.query(Q.where("is_deleted", false), Q.sortBy("name", Q.asc)).fetch()
    ).map(mapInventoryItemRecord);

    const activeSchemeIds = new Set(loadingSchemes.map((item) => item.id));
    const activeInventoryIds = new Set(inventoryItems.map((item) => item.id));
    const schemeInventory = (
      await relationsCollection.query(Q.sortBy("loading_scheme_id", Q.asc), Q.sortBy("inventory_item_id", Q.asc)).fetch()
    )
      .map(mapSchemeInventoryRecord)
      .filter((record) => activeSchemeIds.has(record.loadingSchemeId) && activeInventoryIds.has(record.inventoryItemId));

    const now = new Date();
    const directoryName = `seed-data-${formatFileStamp(now)}`;
    const filePaths = await exportService.exportDictionarySources(directoryName, [
      {
        fileName: "wagons.ts",
        contents: buildSeedFile("WagonRecord", "wagonsSeed", wagons),
      },
      {
        fileName: "packageTypes.ts",
        contents: buildSeedFile("PackageTypeRecord", "packageTypesSeed", packageTypes),
      },
      {
        fileName: "loadingSchemes.ts",
        contents: buildSeedFile("LoadingSchemeTierRecord", "loadingSchemesSeed", loadingSchemes),
      },
      {
        fileName: "inventory.ts",
        contents: buildInventorySeedFile(inventoryItems, schemeInventory),
      },
    ]);

    return {
      directoryName,
      filePaths,
      recommendedSeedVersion: formatVersionDate(now),
    };
  },
  exportDictionaries() {
    return JSON.stringify(demoSeed, null, 2);
  },
};
