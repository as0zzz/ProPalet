import "../global.css";
import "react-native-gesture-handler";

import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DatabaseProvider } from "@/src/db/hooks";
import { useAppBootstrap } from "@/src/hooks/useAppBootstrap";
import { palette, spacing, typography } from "@/src/theme";

function BootstrapGate() {
  const { loading, error } = useAppBootstrap();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={palette.accentStrong} />
        <Text style={styles.title}>Подготавливаем локальную базу</Text>
        <Text style={styles.subtitle}>Seed, настройки и офлайн-справочники загружаются с устройства.</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Ошибка инициализации</Text>
        <Text style={styles.subtitle}>{error}</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: palette.background },
      }}>
      <Stack.Screen name="index" options={{ title: "Подбор схем" }} />
      <Stack.Screen name="schemes/[groupKey]" options={{ title: "Схема погрузки" }} />
      <Stack.Screen name="report/index" options={{ title: "Отчет" }} />
      <Stack.Screen name="reports/index" options={{ title: "История отчетов" }} />
      <Stack.Screen name="admin/index" options={{ title: "Админ-раздел" }} />
      <Stack.Screen name="admin/wagons" options={{ title: "Модели вагонов" }} />
      <Stack.Screen name="admin/package-types" options={{ title: "Типы пакетов" }} />
      <Stack.Screen name="admin/schemes" options={{ title: "Схемы погрузки" }} />
      <Stack.Screen name="admin/inventory" options={{ title: "Инвентарь" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <DatabaseProvider>
          <StatusBar barStyle="light-content" backgroundColor={palette.background} />
          <BootstrapGate />
        </DatabaseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  centered: {
    flex: 1,
    backgroundColor: palette.background,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    color: palette.text,
    fontSize: typography.title,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: "center",
  },
});
