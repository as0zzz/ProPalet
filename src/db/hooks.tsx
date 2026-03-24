import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { Database } from "@nozbe/watermelondb";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { getDatabase } from "@/src/db";
import { palette, spacing, typography } from "@/src/theme";

const DatabaseContext = createContext<Database | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [database, setDatabase] = useState<Database | null>(null);

  useEffect(() => {
    setDatabase(getDatabase());
  }, []);

  if (!database) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={palette.accentStrong} />
        <Text style={styles.title}>Подготавливаем локальную базу</Text>
      </View>
    );
  }

  return <DatabaseContext.Provider value={database}>{children}</DatabaseContext.Provider>;
}

export function useDatabase(): Database {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("DatabaseProvider is not mounted.");
  }

  return context;
}

const styles = StyleSheet.create({
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
});
