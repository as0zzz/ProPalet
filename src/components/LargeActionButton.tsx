import { Pressable, StyleSheet, Text } from "react-native";

import { controlHeights, palette, radius, typography } from "@/src/theme";
import { useUiStore } from "@/src/state/uiStore";

interface LargeActionButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}

export function LargeActionButton({ label, onPress, disabled, variant = "primary" }: LargeActionButtonProps) {
  const productionUiEnabled = useUiStore((state) => state.productionUiEnabled);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { minHeight: productionUiEnabled ? controlHeights.production : controlHeights.regular },
        variantStyles[variant],
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    paddingHorizontal: 20,
  },
  label: {
    color: palette.text,
    fontSize: typography.button,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.45,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: palette.accentStrong,
  },
  secondary: {
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
  },
  danger: {
    backgroundColor: palette.danger,
  },
});
