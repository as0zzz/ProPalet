import { useEffect, useMemo, useState } from "react";

import { usePackageTypesRepo } from "@/src/repositories/packageTypesRepo";
import { useReportsRepo } from "@/src/repositories/reportsRepo";
import { useSchemesRepo } from "@/src/repositories/schemesRepo";
import { useWagonsRepo } from "@/src/repositories/wagonsRepo";
import { buildLoadingReportDocument } from "@/src/services/reportBuilder";
import { exportService, WEB_PRINT_SENTINEL } from "@/src/services/exportService";
import { useWorkflowStore } from "@/src/state/workflowStore";
import type { ReportDocument } from "@/src/types/domain";

function buildFileBase(timestamp: number) {
  return `report-${timestamp}`;
}

export function useReport(reportId?: string) {
  const wagonsRepo = useWagonsRepo();
  const packageTypesRepo = usePackageTypesRepo();
  const schemesRepo = useSchemesRepo();
  const reportsRepo = useReportsRepo();
  const selectedWagonId = useWorkflowStore((state) => state.selectedWagonId);
  const selectedPackageTypeId = useWorkflowStore((state) => state.selectedPackageTypeId);
  const selectedSchemeGroupKey = useWorkflowStore((state) => state.selectedSchemeGroupKey);
  const operatorName = useWorkflowStore((state) => state.operatorName);
  const operatorComment = useWorkflowStore((state) => state.operatorComment);
  const [savedReportId, setSavedReportId] = useState<string | undefined>(reportId);
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<ReportDocument>();
  const [storedReport, setStoredReport] = useState<Awaited<ReturnType<typeof reportsRepo.getById>>>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;

    async function loadDraft() {
      try {
        setLoading(true);

        if (reportId) {
          const report = await reportsRepo.getById(reportId);
          if (!active) {
            return;
          }

          setStoredReport(report);
          if (!report) {
            setDocument(undefined);
            return;
          }

          setDocument({
            title: "Отчет по погрузке",
            timestamp: report.dateTime,
            wagonName: "",
            packageTypeLabel: "",
            schemeName: report.selectedSchemeGroupKey,
            tiers: [],
            inventorySummary: JSON.parse(report.usedInventoryJson),
            operatorComment: report.operatorComment,
            operatorName: report.operatorName,
            text: report.resultText,
            html: report.resultHtml,
          });
          return;
        }

        if (!selectedWagonId || !selectedPackageTypeId || !selectedSchemeGroupKey) {
          setDocument(undefined);
          return;
        }

        const [wagon, packageType, tiers] = await Promise.all([
          wagonsRepo.getById(selectedWagonId),
          packageTypesRepo.getById(selectedPackageTypeId),
          schemesRepo.getTiersWithInventory(selectedSchemeGroupKey),
        ]);

        if (!active || !wagon || !packageType || !tiers.length) {
          return;
        }

        const draft = buildLoadingReportDocument({
          timestamp: Date.now(),
          wagonName: wagon.name,
          packageTypeNumber: packageType.packageTypeNumber,
          constructionVariant: packageType.constructionVariant,
          schemeName: tiers[0].title,
          tiers,
          operatorName,
          operatorComment,
        });

        setDocument(draft);
        setStoredReport(undefined);
        setError(undefined);
      } catch (draftError) {
        if (active) {
          setError(draftError instanceof Error ? draftError.message : "Не удалось подготовить отчет.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDraft();

    return () => {
      active = false;
    };
  }, [
    operatorComment,
    operatorName,
    packageTypesRepo,
    reportId,
    reportsRepo,
    schemesRepo,
    selectedPackageTypeId,
    selectedSchemeGroupKey,
    selectedWagonId,
    wagonsRepo,
  ]);

  const saveReport = async () => {
    if (reportId) {
      return reportId;
    }

    if (!document || !selectedWagonId || !selectedPackageTypeId || !selectedSchemeGroupKey) {
      throw new Error("Недостаточно данных для сохранения отчета.");
    }

    if (savedReportId) {
      return savedReportId;
    }

    const reportKey = `report-${document.timestamp}`;
    const id = await reportsRepo.saveDraft({
      reportId: reportKey,
      wagonId: selectedWagonId,
      packageTypeId: selectedPackageTypeId,
      selectedSchemeGroupKey,
      selectedTierIds: [],
      usedInventoryJson: JSON.stringify(document.inventorySummary),
      document,
      operatorName,
      operatorComment,
    });
    setSavedReportId(id);
    return id;
  };

  const exportTxt = async () => {
    if (!document) {
      throw new Error("Отчет еще не готов.");
    }

    const path = await exportService.exportTxt(buildFileBase(document.timestamp), storedReport?.resultText ?? document.text);
    if (savedReportId || reportId) {
      await reportsRepo.updateExportPaths(savedReportId ?? reportId!, { txtPath: path });
    }
    return path;
  };

  const exportPdf = async () => {
    if (!document) {
      throw new Error("Отчет еще не готов.");
    }

    const path = await exportService.exportPdf(buildFileBase(document.timestamp), storedReport?.resultHtml ?? document.html);
    if (path !== WEB_PRINT_SENTINEL && (savedReportId || reportId)) {
      await reportsRepo.updateExportPaths(savedReportId ?? reportId!, { pdfPath: path });
    }
    return path;
  };

  const shareLatest = async (preferPdf = true) => {
    const path = preferPdf ? await exportPdf() : await exportTxt();
    await exportService.shareFile(path);
  };

  return useMemo(
    () => ({
      document,
      storedReport,
      loading,
      error,
      savedReportId,
      saveReport,
      exportTxt,
      exportPdf,
      shareLatest,
    }),
    [document, error, exportPdf, exportTxt, loading, savedReportId, saveReport, shareLatest, storedReport],
  );
}
