import { useMemo } from "react";
import { Q } from "@nozbe/watermelondb";
import { map } from "rxjs/operators";

import { useDatabase } from "@/src/db/hooks";
import { PackageType } from "@/src/models/PackageType";
import type { AutocompleteOption, PackageTypeRecord } from "@/src/types/domain";
import { DB_TABLES } from "@/src/utils/constants";
import { buildLikeQuery, ensureUniqueValue, getNow, recordAuditLog } from "@/src/repositories/helpers";
import { buildPackageTypeLabel, normalizeSearchTerm } from "@/src/utils/search";

function mapPackageType(record: PackageType): PackageTypeRecord {
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

function toAutocomplete(record: PackageType): AutocompleteOption {
  return {
    id: record.id,
    label: buildPackageTypeLabel(record.packageTypeNumber, record.constructionVariant),
    hint: `${record.packageDimensions}, ${record.nominalPackageMassKg} кг`,
  };
}

function buildSearchLabel(values: Pick<PackageTypeRecord, "packageTypeNumber" | "constructionVariant" | "packageDimensions">) {
  return normalizeSearchTerm(
    `${buildPackageTypeLabel(values.packageTypeNumber, values.constructionVariant)} ${values.packageDimensions}`,
  );
}

export function usePackageTypesRepo() {
  const database = useDatabase();
  const collection = database.get<PackageType>(DB_TABLES.packageTypes);

  return useMemo(
    () => ({
    observeSearch(query: string) {
      return collection
        .query(
          Q.where("is_deleted", false),
          Q.where("search_label", Q.like(buildLikeQuery(query))),
          Q.sortBy("package_type_number", Q.asc),
          Q.take(20),
        )
        .observe()
        .pipe(map((records) => records.map(toAutocomplete)));
    },
    observeAll() {
      return collection
        .query(Q.where("is_deleted", false), Q.sortBy("package_type_number", Q.asc))
        .observe()
        .pipe(map((records) => records.map(mapPackageType)));
    },
    async getById(id: string): Promise<PackageTypeRecord | undefined> {
      try {
        const record = await collection.find(id);
        if (record.isDeleted) {
          return undefined;
        }
        return mapPackageType(record);
      } catch {
        return undefined;
      }
    },
    async save(
      values: Omit<PackageTypeRecord, "createdAt" | "updatedAt" | "isDeleted" | "syncStatus" | "version">,
      editingId?: string,
    ): Promise<void> {
      const uniqueKey = `${values.packageTypeNumber}-${values.constructionVariant}`;
      await database.write(async () => {
        await ensureUniqueValue(collection, "search_label", buildSearchLabel(values), editingId);
        if (editingId) {
          const current = await collection.find(editingId);
          await current.update((record) => {
            record.packageTypeNumber = values.packageTypeNumber;
            record.constructionVariant = values.constructionVariant;
            record.nominalIngotMassKg = values.nominalIngotMassKg;
            record.ingotHeightMm = values.ingotHeightMm;
            record.packageDimensions = values.packageDimensions;
            record.legHeightMm = values.legHeightMm;
            record.legBaseMm = values.legBaseMm;
            record.nominalPackageMassKg = values.nominalPackageMassKg;
            record.packageMassDeviationKg = values.packageMassDeviationKg;
            record.searchLabel = buildSearchLabel(values);
            record.updatedAt = getNow();
            record.syncState = "pending";
            record.version += 1;
          });
          await recordAuditLog(database, "package-type", editingId, "update", values);
          return;
        }

        await collection.create((record) => {
          record._raw.id = values.id || `package-${uniqueKey}`;
          record.packageTypeNumber = values.packageTypeNumber;
          record.constructionVariant = values.constructionVariant;
          record.nominalIngotMassKg = values.nominalIngotMassKg;
          record.ingotHeightMm = values.ingotHeightMm;
          record.packageDimensions = values.packageDimensions;
          record.legHeightMm = values.legHeightMm;
          record.legBaseMm = values.legBaseMm;
          record.nominalPackageMassKg = values.nominalPackageMassKg;
          record.packageMassDeviationKg = values.packageMassDeviationKg;
          record.searchLabel = buildSearchLabel(values);
          record.createdAt = getNow();
          record.updatedAt = getNow();
          record.isDeleted = false;
          record.syncState = "local";
          record.version = 1;
        });
        await recordAuditLog(database, "package-type", values.id || `package-${uniqueKey}`, "create", values);
      });
    },
    async archive(id: string): Promise<void> {
      await database.write(async () => {
        const record = await collection.find(id);
        await record.update((item) => {
          item.isDeleted = true;
          item.updatedAt = getNow();
          item.syncState = "pending";
          item.version += 1;
        });
        await recordAuditLog(database, "package-type", id, "archive", { id });
      });
    },
    }),
    [collection, database],
  );
}
