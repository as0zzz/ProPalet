import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { resolveSchemeImage } from "@/src/utils/assets";
import type { SchemeCardViewModel } from "@/src/types/domain";
import { palette, radius, spacing, typography } from "@/src/theme";
import { LargeActionButton } from "@/src/components/LargeActionButton";

export function SchemeCard({ scheme, onOpen }: { scheme: SchemeCardViewModel; onOpen: () => void }) {
  return (
    <View style={styles.card}>
      <Image source={resolveSchemeImage(scheme.imageKey)} style={styles.image} resizeMode="cover" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{scheme.name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{scheme.tiersCount} ярус.</Text>
          </View>
        </View>
        {scheme.description ? <Text style={styles.description}>{scheme.description}</Text> : null}
        <LargeActionButton label="Открыть" onPress={onOpen} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 150,
    backgroundColor: palette.surfaceAlt,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  title: {
    color: palette.text,
    fontSize: typography.heading,
    fontWeight: "700",
    flex: 1,
  },
  badge: {
    backgroundColor: palette.chip,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: palette.accent,
    fontSize: typography.bodySmall,
    fontWeight: "700",
  },
  description: {
    color: palette.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
