import { useEffect, useState } from "react";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/src/components/EmptyState";
import { LargeActionButton } from "@/src/components/LargeActionButton";
import { Page } from "@/src/components/Page";
import { useReportsRepo } from "@/src/repositories/reportsRepo";
import { exportService, WEB_PRINT_SENTINEL } from "@/src/services/exportService";
import { palette, radius, spacing, typography } from "@/src/theme";
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
                  onPress={() =>
                    void exportService.exportPdf(`history-${item!.dateTime}`, item!.resultHtml).then((path) => {
                      if (path !== WEB_PRINT_SENTINEL) {
                        void reportsRepo.updateExportPaths(item!.id, { pdfPath: path });
                      }
                    })
                  }
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
