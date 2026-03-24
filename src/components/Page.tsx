import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { palette, spacing, typography } from "@/src/theme";

export function Page({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    flexGrow: 1,
    width: "100%",
    padding: spacing.lg,
    gap: spacing.lg,
    backgroundColor: palette.background,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    color: palette.text,
    fontSize: typography.display,
    fontWeight: "800",
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
