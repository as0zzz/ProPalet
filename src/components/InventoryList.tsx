import { StyleSheet, Text, View } from "react-native";

import type { InventoryRequirement } from "@/src/types/domain";
import { palette, radius, spacing, typography } from "@/src/theme";

export function InventoryList({ items }: { items: InventoryRequirement[] }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Требуемый инвентарь</Text>
      {items.map((item) => (
        <View key={item.relationId} style={styles.item}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.description}>
            {item.unitsCount} {item.unitOfMeasure}, {item.configuration}
          </Text>
          {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    color: palette.text,
    fontSize: typography.heading,
    fontWeight: "700",
  },
  item: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.sm,
    gap: 4,
  },
  name: {
    color: palette.text,
    fontWeight: "700",
  },
  description: {
    color: palette.textMuted,
    fontSize: typography.bodySmall,
  },
  note: {
    color: palette.accent,
    fontSize: typography.bodySmall,
  },
});
