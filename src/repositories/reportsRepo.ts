import { useMemo } from "react";
import { Q } from "@nozbe/watermelondb";
import { map } from "rxjs/operators";

import { useDatabase } from "@/src/db/hooks";
import { LoadingReport } from "@/src/models/LoadingReport";
import type { ReportDocument, ReportStatus } from "@/src/types/domain";
import { DB_TABLES } from "@/src/utils/constants";
import { getNow, recordAuditLog } from "@/src/repositories/helpers";

function mapReport(record: LoadingReport) {
  return {
    id: record.id,
    dateTime: record.dateTime,
    wagonId: record.wagonId,
    packageTypeId: record.packageTypeId,
    selectedSchemeGroupKey: record.selectedSchemeGroupKey,
    selectedTierIdsJson: record.selectedTierIdsJson,
    usedInventoryJson: record.usedInventoryJson,
    resultText: record.resultText,
    resultHtml: record.resultHtml,
    txtPath: record.txtPath,
    pdfPath: record.pdfPath,
    status: record.status as ReportStatus,
    operatorComment: record.operatorComment,
    operatorName: record.operatorName,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    isDeleted: record.isDeleted,
  };
}

export function useReportsRepo() {
  const database = useDatabase();
  const collection = database.get<LoadingReport>(DB_TABLES.loadingReports);

  return useMemo(
    () => ({
    observeAll(minDate?: number) {
      const clauses = [Q.where("is_deleted", false), Q.sortBy("date_time", Q.desc)];
      if (typeof minDate === "number") {
        clauses.unshift(Q.where("date_time", Q.gte(minDate)));
      }

      return collection.query(...clauses).observe().pipe(map((records) => records.map(mapReport)));
    },
    async getById(id: string) {
      try {
        const record = await collection.find(id);
        if (record.isDeleted) {
          return undefined;
        }
        return mapReport(record);
      } catch {
        return undefined;
      }
    },
    async saveDraft(input: {
      reportId: string;
      wagonId: string;
      packageTypeId: string;
      selectedSchemeGroupKey: string;
      selectedTierIds: string[];
      usedInventoryJson: string;
      document: ReportDocument;
      operatorName?: string;
      operatorComment?: string;
    }): Promise<string> {
      await database.write(async () => {
        await collection.create((record) => {
          record._raw.id = input.reportId;
          record.dateTime = input.document.timestamp;
          record.wagonId = input.wagonId;
          record.packageTypeId = input.packageTypeId;
          record.selectedSchemeGroupKey = input.selectedSchemeGroupKey;
          record.selectedTierIdsJson = JSON.stringify(input.selectedTierIds);
          record.usedInventoryJson = input.usedInventoryJson;
          record.resultText = input.document.text;
          record.resultHtml = input.document.html;
          record.status = "completed";
          record.operatorName = input.operatorName;
          record.operatorComment = input.operatorComment;
          record.createdAt = getNow();
          record.updatedAt = getNow();
          record.isDeleted = false;
          record.syncState = "local";
          record.version = 1;
        });
        await recordAuditLog(database, "report", input.reportId, "create", {
          selectedSchemeGroupKey: input.selectedSchemeGroupKey,
        });
      });

      return input.reportId;
    },
    async updateExportPaths(reportId: string, values: { txtPath?: string; pdfPath?: string }): Promise<void> {
      await database.write(async () => {
        const record = await collection.find(reportId);
        await record.update((item) => {
          item.txtPath = values.txtPath ?? item.txtPath;
          item.pdfPath = values.pdfPath ?? item.pdfPath;
          item.status = "exported";
          item.updatedAt = getNow();
          item.version += 1;
          item.syncState = "pending";
        });
        await recordAuditLog(database, "report", reportId, "export", values);
      });
    },
    async archive(reportId: string): Promise<void> {
      await database.write(async () => {
        const record = await collection.find(reportId);
        await record.update((item) => {
          item.isDeleted = true;
          item.updatedAt = getNow();
          item.version += 1;
          item.syncState = "pending";
        });
        await recordAuditLog(database, "report", reportId, "archive", { reportId });
      });
    },
    }),
    [collection, database],
  );
}
