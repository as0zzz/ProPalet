import { useMemo } from "react";
import { Q } from "@nozbe/watermelondb";
import { map } from "rxjs/operators";

import { useDatabase } from "@/src/db/hooks";
import { InventoryItem } from "@/src/models/InventoryItem";
import { LoadingScheme } from "@/src/models/LoadingScheme";
import { SchemeInventory } from "@/src/models/SchemeInventory";
import type {
  InventoryRequirement,
  LoadingSchemeTierRecord,
  SchemeCardViewModel,
  SchemeTierViewModel,
} from "@/src/types/domain";
import { DB_TABLES } from "@/src/utils/constants";
import { getNow, recordAuditLog } from "@/src/repositories/helpers";

function mapTierRecord(record: LoadingScheme): LoadingSchemeTierRecord {
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

function mapSchemeCards(records: LoadingScheme[]): SchemeCardViewModel[] {
  const grouped = new Map<string, SchemeCardViewModel>();
  records.forEach((record) => {
    if (grouped.has(record.groupKey)) {
      return;
    }
    grouped.set(record.groupKey, {
      groupKey: record.groupKey,
      name: record.name,
      description: record.description,
      imageKey: record.imageKey,
      tiersCount: record.tiersCount,
      wagonId: record.wagonId,
      packageTypeId: record.packageTypeId,
    });
  });

  return Array.from(grouped.values()).sort((left, right) => left.name.localeCompare(right.name, "ru"));
}

export function useSchemesRepo() {
  const database = useDatabase();
  const schemesCollection = database.get<LoadingScheme>(DB_TABLES.loadingSchemes);
  const relationsCollection = database.get<SchemeInventory>(DB_TABLES.schemeInventories);
  const inventoryCollection = database.get<InventoryItem>(DB_TABLES.inventoryItems);

  return useMemo(
    () => ({
    observeSchemeCards(wagonId?: string, packageTypeId?: string) {
      if (!wagonId || !packageTypeId) {
        return schemesCollection.query(Q.take(0)).observe().pipe(map(() => [] as SchemeCardViewModel[]));
      }

      return schemesCollection
        .query(
          Q.where("wagon_id", wagonId),
          Q.where("package_type_id", packageTypeId),
          Q.where("is_active", true),
          Q.where("is_deleted", false),
          Q.sortBy("name", Q.asc),
        )
        .observe()
        .pipe(map(mapSchemeCards));
    },
    observeAllTiers() {
      return schemesCollection
        .query(Q.where("is_deleted", false), Q.sortBy("group_key", Q.asc), Q.sortBy("tier_order_number", Q.asc))
        .observe()
        .pipe(map((records) => records.map(mapTierRecord)));
    },
    async getTiersByGroupKey(groupKey: string): Promise<LoadingSchemeTierRecord[]> {
      const records = await schemesCollection
        .query(Q.where("group_key", groupKey), Q.where("is_deleted", false), Q.sortBy("tier_order_number", Q.asc))
        .fetch();
      return records.map(mapTierRecord);
    },
    async getTiersWithInventory(groupKey: string): Promise<SchemeTierViewModel[]> {
      const tiers = await this.getTiersByGroupKey(groupKey);
      if (!tiers.length) {
        return [];
      }

      const tierIds = tiers.map((tier) => tier.id);
      const relations = await relationsCollection.query(Q.where("loading_scheme_id", Q.oneOf(tierIds))).fetch();
      const inventoryIds = Array.from(new Set(relations.map((relation) => relation.inventoryItemId)));
      const inventoryItems = await inventoryCollection.query(Q.where("id", Q.oneOf(inventoryIds))).fetch();
      const inventoryMap = new Map(
        inventoryItems.map((item) => [
          item.id,
          {
            id: item.id,
            name: item.name,
            configuration: item.configuration,
            unitOfMeasure: item.unitOfMeasure,
            imageKey: item.imageKey,
          },
        ]),
      );

      const groupedRelations = new Map<string, InventoryRequirement[]>();
      relations.forEach((relation) => {
        const item = inventoryMap.get(relation.inventoryItemId);
        if (!item) {
          return;
        }

        const current = groupedRelations.get(relation.loadingSchemeId) ?? [];
        current.push({
          relationId: relation.id,
          inventoryItemId: relation.inventoryItemId,
          name: item.name,
          configuration: item.configuration,
          unitsCount: relation.unitsCount,
          unitOfMeasure: item.unitOfMeasure,
          note: relation.note,
          imageKey: item.imageKey,
        });
        groupedRelations.set(relation.loadingSchemeId, current);
      });

      return tiers.map((tier) => ({
        id: tier.id,
        groupKey: tier.groupKey,
        title: tier.name,
        description: tier.description,
        imageKey: tier.imageKey,
        instructionText: tier.instructionText,
        tierNote: tier.tierNote,
        tierOrderNumber: tier.tierOrderNumber,
        tiersCount: tier.tiersCount,
        inventory: groupedRelations.get(tier.id) ?? [],
      }));
    },
    async saveTier(
      values: Omit<LoadingSchemeTierRecord, "createdAt" | "updatedAt" | "isDeleted" | "syncStatus" | "version">,
      editingId?: string,
    ): Promise<void> {
      await database.write(async () => {
        if (editingId) {
          const current = await schemesCollection.find(editingId);
          await current.update((record) => {
            record.groupKey = values.groupKey;
            record.name = values.name;
            record.description = values.description;
            record.imageKey = values.imageKey;
            record.tiersCount = values.tiersCount;
            record.tierOrderNumber = values.tierOrderNumber;
            record.wagonId = values.wagonId;
            record.packageTypeId = values.packageTypeId;
            record.instructionText = values.instructionText;
            record.tierNote = values.tierNote;
            record.isActive = values.isActive;
            record.updatedAt = getNow();
            record.syncState = "pending";
            record.version += 1;
          });
          await recordAuditLog(database, "scheme-tier", editingId, "update", values);
          return;
        }

        await schemesCollection.create((record) => {
          record._raw.id = values.id;
          record.groupKey = values.groupKey;
          record.name = values.name;
          record.description = values.description;
          record.imageKey = values.imageKey;
          record.tiersCount = values.tiersCount;
          record.tierOrderNumber = values.tierOrderNumber;
          record.wagonId = values.wagonId;
          record.packageTypeId = values.packageTypeId;
          record.instructionText = values.instructionText;
          record.tierNote = values.tierNote;
          record.isActive = values.isActive;
          record.createdAt = getNow();
          record.updatedAt = getNow();
          record.isDeleted = false;
          record.syncState = "local";
          record.version = 1;
        });
        await recordAuditLog(database, "scheme-tier", values.id, "create", values);
      });
    },
    async archiveTier(id: string): Promise<void> {
      await database.write(async () => {
        const record = await schemesCollection.find(id);
        await record.update((item) => {
          item.isDeleted = true;
          item.updatedAt = getNow();
          item.syncState = "pending";
          item.version += 1;
        });
        await recordAuditLog(database, "scheme-tier", id, "archive", { id });
      });
    },
    }),
    [database, inventoryCollection, relationsCollection, schemesCollection],
  );
}
