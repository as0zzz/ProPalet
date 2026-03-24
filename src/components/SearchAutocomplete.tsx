import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { AutocompleteOption } from "@/src/types/domain";
import { controlHeights, palette, radius, spacing, typography } from "@/src/theme";
import { useUiStore } from "@/src/state/uiStore";

interface SearchAutocompleteProps {
  label: string;
  placeholder: string;
  query: string;
  onChangeQuery: (value: string) => void;
  options: AutocompleteOption[];
  selectedLabel?: string;
  loading?: boolean;
  onSelect: (option: AutocompleteOption) => void;
}

export function SearchAutocomplete(props: SearchAutocompleteProps) {
  const productionUiEnabled = useUiStore((state) => state.productionUiEnabled);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        placeholder={props.placeholder}
        placeholderTextColor={palette.textMuted}
        style={[
          styles.input,
          {
            minHeight: productionUiEnabled ? controlHeights.production : controlHeights.regular,
          },
        ]}
        value={props.query}
        onChangeText={props.onChangeQuery}
      />
      {props.selectedLabel ? (
        <View style={styles.selectedCard}>
          <Text style={styles.selectedCaption}>Выбрано</Text>
          <Text style={styles.selectedValue}>{props.selectedLabel}</Text>
        </View>
      ) : null}
      {props.loading ? <Text style={styles.helper}>Поиск по локальной базе...</Text> : null}
      {!props.selectedLabel && props.options.length ? (
        <View style={styles.options}>
          {props.options.map((option) => (
            <Pressable key={option.id} onPress={() => props.onSelect(option)} style={styles.optionItem}>
              <Text style={styles.optionTitle}>{option.label}</Text>
              {option.hint ? <Text style={styles.optionHint}>{option.hint}</Text> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    color: palette.textMuted,
    fontSize: typography.bodySmall,
    fontWeight: "600",
  },
  input: {
    backgroundColor: palette.surface,
    color: palette.text,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
  },
  selectedCard: {
    backgroundColor: palette.chip,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  selectedCaption: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  selectedValue: {
    color: palette.text,
    fontWeight: "600",
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  helper: {
    color: palette.textMuted,
    fontSize: typography.bodySmall,
  },
  options: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: "hidden",
  },
  optionItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  optionTitle: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  optionHint: {
    color: palette.textMuted,
    fontSize: typography.bodySmall,
    marginTop: 4,
  },
});
