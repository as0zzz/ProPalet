import { useMemo } from "react";
import { Q } from "@nozbe/watermelondb";
import { map } from "rxjs/operators";

import { AuditLog } from "@/src/models/AuditLog";
import { DB_TABLES } from "@/src/utils/constants";
import { useDatabase } from "@/src/db/hooks";

function mapAudit(record: AuditLog) {
  return {
    id: record.id,
    entityType: record.entityType,
    entityId: record.entityId,
    action: record.action,
    payloadJson: record.payloadJson,
    createdAt: record.createdAt,
  };
}

export function useAuditRepo() {
  const database = useDatabase();
  const collection = database.get<AuditLog>(DB_TABLES.auditLogs);

  return useMemo(
    () => ({
    observeLatest(limit = 12) {
      return collection
        .query(Q.sortBy("created_at", Q.desc), Q.take(limit))
        .observe()
        .pipe(map((records) => records.map(mapAudit)));
    },
    }),
    [collection],
  );
}
