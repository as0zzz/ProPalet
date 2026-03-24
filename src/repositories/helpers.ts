import { Collection, Database, Model, Q } from "@nozbe/watermelondb";

import { AuditLog } from "@/src/models/AuditLog";
import { DB_TABLES } from "@/src/utils/constants";
import { normalizeSearchTerm } from "@/src/utils/search";

type MutableModel = Model & { _raw: { id: string } };

export function assignModelId(model: Model, id: string): void {
  (model as MutableModel)._raw.id = id;
}

export function getNow(): number {
  return Date.now();
}

export function buildLikeQuery(value: string): string {
  return `%${normalizeSearchTerm(value)}%`;
}

export async function recordAuditLog(
  database: Database,
  entityType: string,
  entityId: string,
  action: string,
  payload: unknown,
): Promise<void> {
  const collection = database.get<AuditLog>(DB_TABLES.auditLogs);
  await collection.create((record) => {
    assignModelId(record, `${entityType}-${entityId}-${getNow()}`);
    record.entityType = entityType;
    record.entityId = entityId;
    record.action = action;
    record.payloadJson = JSON.stringify(payload);
    record.createdAt = getNow();
  });
}

export async function ensureUniqueValue<T extends Model>(
  collection: Collection<T>,
  field: string,
  value: string,
  exceptId?: string,
): Promise<void> {
  const existing = await collection.query(Q.where(field, value)).fetch();
  const hasConflict = existing.some((item) => item.id !== exceptId);
  if (hasConflict) {
    throw new Error("Запись с таким значением уже существует.");
  }
}
