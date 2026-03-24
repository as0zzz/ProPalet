import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { palette, radius, spacing, typography } from "@/src/theme";
import { controlHeights } from "@/src/theme";
import { useUiStore } from "@/src/state/uiStore";

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function FormField({ label, error, multiline, style, ...props }: FormFieldProps) {
  const productionUiEnabled = useUiStore((state) => state.productionUiEnabled);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={palette.textMuted}
        style={[
          styles.input,
          {
            minHeight: multiline ? 120 : productionUiEnabled ? controlHeights.production : controlHeights.regular,
            textAlignVertical: multiline ? "top" : "center",
          },
          style,
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    color: palette.textMuted,
    fontSize: typography.bodySmall,
    fontWeight: "600",
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    color: palette.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body,
  },
  error: {
    color: palette.danger,
    fontSize: typography.bodySmall,
  },
});
