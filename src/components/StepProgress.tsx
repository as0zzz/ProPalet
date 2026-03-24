import { StyleSheet, Text, View } from "react-native";

import { palette, spacing, typography } from "@/src/theme";

export function StepProgress({
  total,
  current,
  completedIds,
  tierIds,
}: {
  total: number;
  current: number;
  completedIds: string[];
  tierIds: string[];
}) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, index) => {
        const tierId = tierIds[index];
        const completed = tierId ? completedIds.includes(tierId) : false;
        const isCurrent = index === current;
        return (
          <View key={`step-${index}`} style={[styles.item, completed ? styles.completed : null, isCurrent ? styles.current : null]}>
            <Text style={styles.label}>{index + 1}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  item: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surface,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  current: {
    borderColor: palette.accentStrong,
  },
  completed: {
    backgroundColor: palette.success,
    borderColor: palette.success,
  },
  label: {
    color: palette.text,
    fontWeight: "800",
    fontSize: typography.body,
  },
});
