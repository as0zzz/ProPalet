import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/src/components/EmptyState";
import { LargeActionButton } from "@/src/components/LargeActionButton";
import { Page } from "@/src/components/Page";
import { useDatabase } from "@/src/db/hooks";
import { useAuditRepo } from "@/src/repositories/auditRepo";
import { seedService } from "@/src/services/seedService";
import { palette, radius, spacing, typography } from "@/src/theme";
import { formatDateTime } from "@/src/utils/date";

export default function AdminIndexScreen() {
  const database = useDatabase();
  const auditRepo = useAuditRepo();
  const [logs, setLogs] = useState<Array<{ id: string; entityType: string; action: string; createdAt: number }>>([]);

  useEffect(() => {
    const subscription = auditRepo.observeLatest(10).subscribe({
      next: (value) =>
        setLogs(
          value.map((item) => ({
            id: item.id,
            entityType: item.entityType,
            action: item.action,
            createdAt: item.createdAt,
          })),
        ),
      error: () => setLogs([]),
    });

    return () => subscription.unsubscribe();
  }, [auditRepo]);

  return (
    <Page title="Админ-раздел" subtitle="CRUD справочников, импорт демо-данных, экспорт seedData и аудит локальных изменений.">
      <View style={styles.grid}>
        <LargeActionButton label="Вагоны" onPress={() => router.push("/admin/wagons")} />
        <LargeActionButton label="Типы пакетов" onPress={() => router.push("/admin/package-types")} />
        <LargeActionButton label="Схемы" onPress={() => router.push("/admin/schemes")} />
        <LargeActionButton label="Инвентарь" onPress={() => router.push("/admin/inventory")} />
      </View>

      <View style={styles.actions}>
        <LargeActionButton label="Импортировать демо-данные" variant="secondary" onPress={() => void seedService.applySeed(database)} />
        <LargeActionButton
          label="Экспортировать seedData (4 файла)"
          variant="secondary"
          onPress={() =>
            void seedService
              .exportCurrentSeedData(database)
              .then((result) => {
                Alert.alert(
                  "Файлы сохранены",
                  `Сохранено ${result.filePaths.length} seedData-файла.\n\nПапка: ${result.directoryName}\n\nДальше замените файлы в src/db/seedData/ и при выпуске новой версии обновите DEMO_SEED_VERSION, например на ${result.recommendedSeedVersion}.`,
                );
              })
              .catch((error: unknown) => {
                const message = error instanceof Error ? error.message : "Не удалось экспортировать seedData.";
                Alert.alert("Ошибка экспорта", message);
              })
          }
        />
      </View>

      <View style={styles.auditCard}>
        <Text style={styles.auditTitle}>Последние записи аудита</Text>
        {!logs.length ? (
          <EmptyState title="Журнал пуст" message="После изменений в справочниках здесь появятся записи аудита." />
        ) : (
          <ScrollView style={styles.auditScroll} contentContainerStyle={styles.auditList} nestedScrollEnabled>
            {logs.map((item) => (
              <View key={item.id} style={styles.auditItem}>
                <Text style={styles.auditText}>
                  {item.entityType} / {item.action}
                </Text>
                <Text style={styles.auditTime}>{formatDateTime(item.createdAt)}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.md,
  },
  actions: {
    gap: spacing.md,
  },
  auditCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
    minHeight: 320,
  },
  auditTitle: {
    color: palette.text,
    fontSize: typography.heading,
    fontWeight: "800",
  },
  auditScroll: {
    maxHeight: 240,
  },
  auditList: {
    gap: spacing.sm,
  },
  auditItem: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.xs,
  },
  auditText: {
    color: palette.text,
    fontWeight: "700",
  },
  auditTime: {
    color: palette.textMuted,
    fontSize: typography.bodySmall,
  },
});
