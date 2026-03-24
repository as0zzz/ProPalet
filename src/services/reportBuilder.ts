import type { InventoryRequirement, ReportDocument, ReportInventorySummary, SchemeTierViewModel } from "@/src/types/domain";
import { formatDateTime } from "@/src/utils/date";
import { buildPackageTypeLabel } from "@/src/utils/search";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildInventorySummary(tiers: SchemeTierViewModel[]): ReportInventorySummary[] {
  const aggregated = new Map<string, ReportInventorySummary>();

  tiers.forEach((tier) => {
    tier.inventory.forEach((item) => {
      const current = aggregated.get(item.inventoryItemId);
      if (current) {
        current.totalUnits += item.unitsCount;
        return;
      }

      aggregated.set(item.inventoryItemId, {
        inventoryItemId: item.inventoryItemId,
        name: item.name,
        configuration: item.configuration,
        totalUnits: item.unitsCount,
        unitOfMeasure: item.unitOfMeasure,
      });
    });
  });

  return Array.from(aggregated.values());
}

function inventoryLines(inventory: InventoryRequirement[]): string[] {
  return inventory.map(
    (item) => `- ${item.name}: ${item.unitsCount} ${item.unitOfMeasure}, ${item.configuration}${item.note ? ` (${item.note})` : ""}`,
  );
}

export function buildLoadingReportDocument(input: {
  timestamp: number;
  wagonName: string;
  packageTypeNumber: number;
  constructionVariant: string;
  schemeName: string;
  tiers: SchemeTierViewModel[];
  operatorName?: string;
  operatorComment?: string;
}): ReportDocument {
  const inventorySummary = buildInventorySummary(input.tiers);
  const packageTypeLabel = buildPackageTypeLabel(input.packageTypeNumber, input.constructionVariant);
  const dateTime = formatDateTime(input.timestamp);
  const lines = [
    "Отчет по погрузке",
    `Дата и время: ${dateTime}`,
    `Модель вагона: ${input.wagonName}`,
    `Тип пакета: ${packageTypeLabel}`,
    `Схема: ${input.schemeName}`,
    "",
    "Ярусы:",
    ...input.tiers.flatMap((tier) => [
      `Ярус ${tier.tierOrderNumber}/${tier.tiersCount}: ${tier.instructionText}`,
      ...inventoryLines(tier.inventory),
      tier.tierNote ? `Примечание: ${tier.tierNote}` : "",
      "",
    ]),
    "Сводка по инвентарю:",
    ...inventorySummary.map((item) => `- ${item.name}: ${item.totalUnits} ${item.unitOfMeasure}, ${item.configuration}`),
    input.operatorComment ? `Комментарий оператора: ${input.operatorComment}` : "",
    input.operatorName ? `Оператор: ${input.operatorName}` : "",
  ].filter(Boolean);

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1f2933; }
          h1 { font-size: 24px; margin-bottom: 12px; }
          h2 { font-size: 18px; margin-top: 20px; }
          p, li { font-size: 14px; line-height: 1.5; }
          .muted { color: #52606d; }
        </style>
      </head>
      <body>
        <h1>Отчет по погрузке</h1>
        <p><strong>Дата и время:</strong> ${escapeHtml(dateTime)}</p>
        <p><strong>Модель вагона:</strong> ${escapeHtml(input.wagonName)}</p>
        <p><strong>Тип пакета:</strong> ${escapeHtml(packageTypeLabel)}</p>
        <p><strong>Схема:</strong> ${escapeHtml(input.schemeName)}</p>
        <h2>Ярусы</h2>
        ${input.tiers
          .map(
            (tier) => `
              <p><strong>Ярус ${tier.tierOrderNumber}/${tier.tiersCount}:</strong> ${escapeHtml(tier.instructionText)}</p>
              <ul>${tier.inventory
                .map(
                  (item) =>
                    `<li>${escapeHtml(item.name)}: ${item.unitsCount} ${escapeHtml(item.unitOfMeasure)}, ${escapeHtml(item.configuration)}${
                      item.note ? ` (${escapeHtml(item.note)})` : ""
                    }</li>`,
                )
                .join("")}</ul>
              ${tier.tierNote ? `<p class="muted">Примечание: ${escapeHtml(tier.tierNote)}</p>` : ""}
            `,
          )
          .join("")}
        <h2>Сводка по инвентарю</h2>
        <ul>${inventorySummary
          .map(
            (item) =>
              `<li>${escapeHtml(item.name)}: ${item.totalUnits} ${escapeHtml(item.unitOfMeasure)}, ${escapeHtml(item.configuration)}</li>`,
          )
          .join("")}</ul>
        ${input.operatorComment ? `<p><strong>Комментарий оператора:</strong> ${escapeHtml(input.operatorComment)}</p>` : ""}
        ${input.operatorName ? `<p><strong>Оператор:</strong> ${escapeHtml(input.operatorName)}</p>` : ""}
      </body>
    </html>
  `;

  return {
    title: "Отчет по погрузке",
    timestamp: input.timestamp,
    wagonName: input.wagonName,
    packageTypeLabel,
    schemeName: input.schemeName,
    tiers: input.tiers.map((tier) => ({
      tierOrderNumber: tier.tierOrderNumber,
      instructionText: tier.instructionText,
      inventory: tier.inventory,
    })),
    inventorySummary,
    operatorComment: input.operatorComment,
    operatorName: input.operatorName,
    text: lines.join("\n"),
    html,
  };
}
