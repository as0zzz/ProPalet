import { router, useLocalSearchParams } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { InventoryList } from "@/src/components/InventoryList";
import { LargeActionButton } from "@/src/components/LargeActionButton";
import { Page } from "@/src/components/Page";
import { StepProgress } from "@/src/components/StepProgress";
import { useStepFlow } from "@/src/hooks/useStepFlow";
import { palette, radius, spacing, typography } from "@/src/theme";
import { resolveSchemeImage } from "@/src/utils/assets";

export default function SchemeDetailsScreen() {
  const params = useLocalSearchParams<{ groupKey: string }>();
  const stepFlow = useStepFlow(params.groupKey);

  if (stepFlow.loading || !stepFlow.currentTier) {
    return (
      <Page title="Схема погрузки" subtitle="Загружаем ярусы и инвентарь...">
        <Text style={styles.loadingText}>Подождите, формируем локальный wizard по ярусам.</Text>
      </Page>
    );
  }

  return (
    <Page title={stepFlow.currentTier.title} subtitle="Переход вперед доступен только после завершения текущего яруса.">
      <StepProgress
        total={stepFlow.tiers.length}
        current={stepFlow.currentStepIndex}
        completedIds={stepFlow.completedTierIds}
        tierIds={stepFlow.tiers.map((tier) => tier.id)}
      />

      <View style={styles.card}>
        <Image source={resolveSchemeImage(stepFlow.currentTier.imageKey)} style={styles.image} resizeMode="cover" />
        <View style={styles.cardContent}>
          <View style={styles.headingRow}>
            <Text style={styles.heading}>
              Ярус {stepFlow.currentTier.tierOrderNumber} из {stepFlow.currentTier.tiersCount}
            </Text>
            <View style={[styles.statusBadge, stepFlow.currentTierCompleted ? styles.statusDone : styles.statusCurrent]}>
              <Text style={styles.statusText}>{stepFlow.currentTierCompleted ? "Завершено" : "Текущий"}</Text>
            </View>
          </View>
          <Text style={styles.instructions}>{stepFlow.currentTier.instructionText}</Text>
          {stepFlow.currentTier.tierNote ? <Text style={styles.note}>Примечание: {stepFlow.currentTier.tierNote}</Text> : null}
        </View>
      </View>

      <InventoryList items={stepFlow.currentTier.inventory} />

      <Pressable onPress={stepFlow.toggleCurrentTier} style={[styles.checkbox, stepFlow.currentTierCompleted ? styles.checkboxActive : null]}>
        <Text style={styles.checkboxText}>
          {stepFlow.currentTierCompleted ? "Ярус отмечен как завершенный" : "Отметить ярус как завершенный"}
        </Text>
      </Pressable>

      <View style={styles.actionsRow}>
        <LargeActionButton label="Назад" variant="secondary" onPress={stepFlow.goBack} disabled={stepFlow.currentStepIndex === 0} />
        {stepFlow.canMoveNext ? (
          <LargeActionButton label="Далее" onPress={stepFlow.goNext} />
        ) : (
          <LargeActionButton
            label="Завершить схему"
            onPress={() => {
              if (stepFlow.canFinish) {
                router.push("/report");
              }
            }}
            disabled={!stepFlow.canFinish}
          />
        )}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 220,
  },
  cardContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    alignItems: "center",
  },
  heading: {
    color: palette.text,
    fontSize: typography.heading,
    fontWeight: "800",
    flex: 1,
  },
  statusBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusCurrent: {
    backgroundColor: palette.chip,
  },
  statusDone: {
    backgroundColor: palette.success,
  },
  statusText: {
    color: palette.text,
    fontWeight: "700",
  },
  instructions: {
    color: palette.text,
    fontSize: typography.body,
    lineHeight: 24,
  },
  note: {
    color: palette.accent,
    fontSize: typography.body,
  },
  checkbox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  checkboxActive: {
    borderColor: palette.success,
  },
  checkboxText: {
    color: palette.text,
    fontWeight: "700",
    fontSize: typography.body,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  loadingText: {
    color: palette.textMuted,
    fontSize: typography.body,
  },
});
