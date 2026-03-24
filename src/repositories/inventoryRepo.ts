import { useMemo } from "react";
import { Q } from "@nozbe/watermelondb";
import { map } from "rxjs/operators";

import { useDatabase } from "@/src/db/hooks";
import { InventoryItem } from "@/src/models/InventoryItem";
import type { InventoryItemRecord } from "@/src/types/domain";
import { DB_TABLES } from "@/src/utils/constants";
import { ensureUniqueValue, getNow, recordAuditLog } from "@/src/repositories/helpers";
import { normalizeSearchTerm } from "@/src/utils/search";

function mapInventory(record: InventoryItem): InventoryItemRecord {
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

export function useInventoryRepo() {
  const database = useDatabase();
  const collection = database.get<InventoryItem>(DB_TABLES.inventoryItems);

  return useMemo(
    () => ({
    observeAll() {
      return collection
        .query(Q.where("is_deleted", false), Q.sortBy("name", Q.asc))
        .observe()
        .pipe(map((records) => records.map(mapInventory)));
    },
    async getByIds(ids: string[]): Promise<InventoryItemRecord[]> {
      if (!ids.length) {
        return [];
      }

      const records = await collection.query(Q.where("id", Q.oneOf(ids))).fetch();
      return records.filter((record) => !record.isDeleted).map(mapInventory);
    },
    async save(
      values: Omit<InventoryItemRecord, "createdAt" | "updatedAt" | "isDeleted" | "syncStatus" | "version">,
      editingId?: string,
    ): Promise<void> {
      await database.write(async () => {
        await ensureUniqueValue(collection, "name", values.name, editingId);
        if (editingId) {
          const current = await collection.find(editingId);
          await current.update((record) => {
            record.name = values.name;
            record.nameSearch = normalizeSearchTerm(values.name);
            record.quantity = values.quantity;
            record.configuration = values.configuration;
            record.imageKey = values.imageKey;
            record.unitOfMeasure = values.unitOfMeasure;
            record.updatedAt = getNow();
            record.syncState = "pending";
            record.version += 1;
          });
          await recordAuditLog(database, "inventory", editingId, "update", values);
          return;
        }

        await collection.create((record) => {
          record._raw.id = values.id;
          record.name = values.name;
          record.nameSearch = normalizeSearchTerm(values.name);
          record.quantity = values.quantity;
          record.configuration = values.configuration;
          record.imageKey = values.imageKey;
          record.unitOfMeasure = values.unitOfMeasure;
          record.createdAt = getNow();
          record.updatedAt = getNow();
          record.isDeleted = false;
          record.syncState = "local";
          record.version = 1;
        });
        await recordAuditLog(database, "inventory", values.id, "create", values);
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
        await recordAuditLog(database, "inventory", id, "archive", { id });
      });
    },
    }),
    [collection, database],
  );
}
