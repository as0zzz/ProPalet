import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";

import { FormField } from "@/src/components/FormField";
import { LargeActionButton } from "@/src/components/LargeActionButton";
import { Page } from "@/src/components/Page";
import { useReport } from "@/src/hooks/useReport";
import { useWorkflowStore } from "@/src/state/workflowStore";
import { palette, radius, spacing, typography } from "@/src/theme";
import { reportMetaSchema, type ReportMetaValues } from "@/src/utils/validation";

export default function ReportScreen() {
  const params = useLocalSearchParams<{ reportId?: string }>();
  const setReportMeta = useWorkflowStore((state) => state.setReportMeta);
  const { document, storedReport, loading, error, saveReport, exportPdf } = useReport(params.reportId);
  const form = useForm<ReportMetaValues>({
    resolver: zodResolver(reportMetaSchema),
    defaultValues: {
      operatorName: storedReport?.operatorName,
      operatorComment: storedReport?.operatorComment,
    },
  });

  const operatorName = form.watch("operatorName");
  const operatorComment = form.watch("operatorComment");

  useEffect(() => {
    if (!params.reportId) {
      setReportMeta({ operatorName, operatorComment });
    }
  }, [operatorComment, operatorName, params.reportId, setReportMeta]);

  return (
    <Page title="Отчет" subtitle="PDF формируется локально. На web откроется системное окно печати браузера.">
      {loading || !document ? <Text style={styles.loading}>Подготавливаем отчет...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!params.reportId ? (
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Данные оператора</Text>
          <Controller
            control={form.control}
            name="operatorName"
            render={({ field, fieldState }) => (
              <FormField label="ФИО оператора" value={field.value ?? ""} onChangeText={field.onChange} error={fieldState.error?.message} />
            )}
          />
          <Controller
            control={form.control}
            name="operatorComment"
            render={({ field, fieldState }) => (
              <FormField
                label="Комментарий"
                value={field.value ?? ""}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
                multiline
              />
            )}
          />
        </View>
      ) : null}

      {document ? (
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>{document.title}</Text>
          <Text style={styles.previewText}>{storedReport?.resultText ?? document.text}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {!params.reportId ? <LargeActionButton label="Сохранить в БД" onPress={() => void saveReport()} /> : null}
        <LargeActionButton label="Экспорт PDF" variant="secondary" onPress={() => void exportPdf()} />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  loading: {
    color: palette.textMuted,
    fontSize: typography.body,
  },
  error: {
    color: palette.danger,
    fontSize: typography.bodySmall,
  },
  formCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    color: palette.text,
    fontSize: typography.heading,
    fontWeight: "800",
  },
  previewCard: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  previewTitle: {
    color: palette.text,
    fontSize: typography.heading,
    fontWeight: "800",
  },
  previewText: {
    color: palette.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  actions: {
    gap: spacing.md,
  },
});
