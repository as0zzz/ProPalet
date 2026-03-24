import { StyleSheet, Text, View } from "react-native";

import { palette, spacing, typography } from "@/src/theme";

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.sm,
  },
  title: {
    color: palette.text,
    fontSize: typography.heading,
    fontWeight: "700",
  },
  message: {
    color: palette.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
