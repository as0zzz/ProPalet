import { useMemo } from "react";
import { Q } from "@nozbe/watermelondb";
import { map } from "rxjs/operators";

import { useDatabase } from "@/src/db/hooks";
import { Wagon } from "@/src/models/Wagon";
import type { AutocompleteOption, WagonRecord } from "@/src/types/domain";
import { DB_TABLES } from "@/src/utils/constants";
import { buildLikeQuery, ensureUniqueValue, getNow, recordAuditLog } from "@/src/repositories/helpers";
import { normalizeSearchTerm } from "@/src/utils/search";

function mapWagon(record: Wagon): WagonRecord {
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

function toAutocomplete(record: Wagon): AutocompleteOption {
  return {
    id: record.id,
    label: record.name,
    hint: record.code ?? record.description,
  };
}

export function useWagonsRepo() {
  const database = useDatabase();
  const collection = database.get<Wagon>(DB_TABLES.wagons);

  return useMemo(
    () => ({
    observeSearch(query: string) {
      return collection
        .query(
          Q.where("is_deleted", false),
          Q.where("name_search", Q.like(buildLikeQuery(query))),
          Q.sortBy("name", Q.asc),
          Q.take(20),
        )
        .observe()
        .pipe(map((records) => records.map(toAutocomplete)));
    },
    observeAll() {
      return collection
        .query(Q.where("is_deleted", false), Q.sortBy("name", Q.asc))
        .observe()
        .pipe(map((records) => records.map(mapWagon)));
    },
    async getById(id: string): Promise<WagonRecord | undefined> {
      try {
        const record = await collection.find(id);
        if (record.isDeleted) {
          return undefined;
        }
        return mapWagon(record);
      } catch {
        return undefined;
      }
    },
    async save(values: Omit<WagonRecord, "createdAt" | "updatedAt" | "isDeleted" | "syncStatus" | "version">, editingId?: string): Promise<void> {
      await database.write(async () => {
        await ensureUniqueValue(collection, "name", values.name, editingId);
        if (editingId) {
          const current = await collection.find(editingId);
          await current.update((record) => {
            record.name = values.name;
            record.nameSearch = normalizeSearchTerm(values.name);
            record.code = values.code;
            record.description = values.description;
            record.capacityKg = values.capacityKg;
            record.innerLengthMm = values.innerLengthMm;
            record.innerWidthMm = values.innerWidthMm;
            record.innerHeightMm = values.innerHeightMm;
            record.updatedAt = getNow();
            record.syncState = "pending";
            record.version += 1;
          });
          await recordAuditLog(database, "wagon", editingId, "update", values);
          return;
        }

        await collection.create((record) => {
          record._raw.id = values.id;
          record.name = values.name;
          record.nameSearch = normalizeSearchTerm(values.name);
          record.code = values.code;
          record.description = values.description;
          record.capacityKg = values.capacityKg;
          record.innerLengthMm = values.innerLengthMm;
          record.innerWidthMm = values.innerWidthMm;
          record.innerHeightMm = values.innerHeightMm;
          record.createdAt = getNow();
          record.updatedAt = getNow();
          record.isDeleted = false;
          record.syncState = "local";
          record.version = 1;
        });
        await recordAuditLog(database, "wagon", values.id, "create", values);
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
        await recordAuditLog(database, "wagon", id, "archive", { id });
      });
    },
    }),
    [collection, database],
  );
}
