import { useEffect, useState } from "react";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/src/components/EmptyState";
import { LargeActionButton } from "@/src/components/LargeActionButton";
import { Page } from "@/src/components/Page";
import { useReportsRepo } from "@/src/repositories/reportsRepo";
import { exportService, WEB_PRINT_SENTINEL } from "@/src/services/exportService";
import { palette, radius, spacing, typography } from "@/src/theme";
import { ANDROID_REPORTS_PICKER_DIRECTORY } from "@/src/utils/constants";
import { formatDateTime, startOfTodayTimestamp } from "@/src/utils/date";

type FilterKey = "all" | "today";

export default function ReportsHistoryScreen() {
  const reportsRepo = useReportsRepo();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [reports, setReports] = useState<Awaited<ReturnType<typeof reportsRepo.getById>>[]>([]);

  useEffect(() => {
    const subscription = reportsRepo.observeAll(filter === "today" ? startOfTodayTimestamp() : undefined).subscribe({
      next: (value) => setReports(value),
      error: () => setReports([]),
    });
    return () => subscription.unsubscribe();
  }, [filter, reportsRepo]);

  const runPdfExport = async (reportId: string, timestamp: number, html: string) => {
    try {
      const path = await exportService.exportPdf(`history-${timestamp}`, html);
      if (path === WEB_PRINT_SENTINEL) {
        Alert.alert("Экспорт PDF", "Открылось системное окно печати браузера. Сохраните документ как PDF.");
        return;
      }

      await reportsRepo.updateExportPaths(reportId, { pdfPath: path });
      Alert.alert(
        "PDF сохранен",
        `Файл сохранен в Documents/${ANDROID_REPORTS_PICKER_DIRECTORY}.\n\nЕсли папка уже была на устройстве, приложение использовало ее повторно.\n\nПуть системы:\n${path}`,
      );
    } catch (exportError) {
      const message = exportError instanceof Error ? exportError.message : "Не удалось экспортировать PDF.";
      Alert.alert("Ошибка экспорта PDF", message);
    }
  };

  const handlePdfExport = (reportId: string, timestamp: number, html: string) => {
    if (Platform.OS === "android") {
      Alert.alert(
        "Экспорт PDF",
        `Сейчас Android откроет системное окно выбора папки.\n\nВыберите Documents и нажмите Use this folder. Приложение само проверит, есть ли внутри папка ${ANDROID_REPORTS_PICKER_DIRECTORY}, создаст ее при необходимости и сохранит PDF туда.`,
        [
          { text: "Отмена", style: "cancel" },
          { text: "Продолжить", onPress: () => void runPdfExport(reportId, timestamp, html) },
        ],
      );
      return;
    }

    void runPdfExport(reportId, timestamp, html);
  };

  return (
    <Page title="История отчетов" subtitle="Все отчеты лежат локально. Повторный экспорт в PDF не требует сети.">
      <View style={styles.filterRow}>
        <Pressable style={[styles.filterChip, filter === "all" ? styles.filterChipActive : null]} onPress={() => setFilter("all")}>
          <Text style={styles.filterText}>Все</Text>
        </Pressable>
        <Pressable style={[styles.filterChip, filter === "today" ? styles.filterChipActive : null]} onPress={() => setFilter("today")}>
          <Text style={styles.filterText}>Сегодня</Text>
        </Pressable>
      </View>

      {!reports.length ? (
        <EmptyState title="История пуста" message="После сохранения отчет появится здесь и будет доступен для повторного открытия." />
      ) : (
        <FlashList
          data={reports.filter(Boolean)}
          keyExtractor={(item) => item!.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{formatDateTime(item!.dateTime)}</Text>
              <Text style={styles.cardText}>Схема: {item!.selectedSchemeGroupKey}</Text>
              <Text style={styles.cardText}>Статус: {item!.status}</Text>
              <View style={styles.cardActions}>
                <LargeActionButton label="Открыть" variant="secondary" onPress={() => router.push({ pathname: "/report", params: { reportId: item!.id } })} />
                <LargeActionButton
                  label="PDF"
                  variant="secondary"
                  onPress={() => handlePdfExport(item!.id, item!.dateTime, item!.resultHtml)}
                />
                <LargeActionButton label="Удалить" variant="danger" onPress={() => void reportsRepo.archive(item!.id)} />
              </View>
            </View>
          )}
        />
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  filterChipActive: {
    backgroundColor: palette.chip,
  },
  filterText: {
    color: palette.text,
    fontWeight: "700",
  },
  card: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: palette.text,
    fontSize: typography.heading,
    fontWeight: "800",
  },
  cardText: {
    color: palette.textMuted,
    fontSize: typography.body,
  },
  cardActions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
