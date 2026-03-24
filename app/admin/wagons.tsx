import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FormField } from "@/src/components/FormField";
import { LargeActionButton } from "@/src/components/LargeActionButton";
import { Page } from "@/src/components/Page";
import { useWagonsRepo } from "@/src/repositories/wagonsRepo";
import type { WagonRecord } from "@/src/types/domain";
import { palette, radius, spacing, typography } from "@/src/theme";
import { wagonFormSchema, type WagonFormValues } from "@/src/utils/validation";

const initialValues: WagonFormValues = {
  name: "",
  code: "",
  description: "",
  capacityKg: undefined,
  innerLengthMm: undefined,
  innerWidthMm: undefined,
  innerHeightMm: undefined,
};

export default function WagonsAdminScreen() {
  const wagonsRepo = useWagonsRepo();
  const [wagons, setWagons] = useState<WagonRecord[]>([]);
  const [editingId, setEditingId] = useState<string>();
  const form = useForm<any>({
    resolver: zodResolver(wagonFormSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    const subscription = wagonsRepo.observeAll().subscribe({
      next: setWagons,
      error: () => setWagons([]),
    });
    return () => subscription.unsubscribe();
  }, [wagonsRepo]);

  return (
    <Page title="Модели вагонов" subtitle="Справочник используется локальным поиском на главном экране.">
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{editingId ? "Редактирование модели" : "Новая модель"}</Text>
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => <FormField label="Название" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />}
        />
        <Controller
          control={form.control}
          name="code"
          render={({ field, fieldState }) => <FormField label="Код" value={field.value ?? ""} onChangeText={field.onChange} error={fieldState.error?.message} />}
        />
        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <FormField label="Описание" value={field.value ?? ""} onChangeText={field.onChange} error={fieldState.error?.message} multiline />
          )}
        />
        <Controller
          control={form.control}
          name="capacityKg"
          render={({ field, fieldState }) => (
            <FormField label="Грузоподъемность, кг" value={field.value ? String(field.value) : ""} onChangeText={field.onChange} error={fieldState.error?.message} keyboardType="numeric" />
          )}
        />
        <Controller
          control={form.control}
          name="innerLengthMm"
          render={({ field, fieldState }) => (
            <FormField label="Внутренняя длина, мм" value={field.value ? String(field.value) : ""} onChangeText={field.onChange} error={fieldState.error?.message} keyboardType="numeric" />
          )}
        />
        <Controller
          control={form.control}
          name="innerWidthMm"
          render={({ field, fieldState }) => (
            <FormField label="Внутренняя ширина, мм" value={field.value ? String(field.value) : ""} onChangeText={field.onChange} error={fieldState.error?.message} keyboardType="numeric" />
          )}
        />
        <Controller
          control={form.control}
          name="innerHeightMm"
          render={({ field, fieldState }) => (
            <FormField label="Внутренняя высота, мм" value={field.value ? String(field.value) : ""} onChangeText={field.onChange} error={fieldState.error?.message} keyboardType="numeric" />
          )}
        />
        <LargeActionButton
          label={editingId ? "Сохранить изменения" : "Создать модель"}
          onPress={form.handleSubmit(async (values) => {
            const parsed = wagonFormSchema.parse(values);
            await wagonsRepo.save(
              {
                id: editingId ?? `wagon-${Date.now()}`,
                ...parsed,
              },
              editingId,
            );
            setEditingId(undefined);
            form.reset(initialValues);
          })}
        />
      </View>

      <View style={styles.list}>
        {wagons.map((wagon) => (
          <View key={wagon.id} style={styles.item}>
            <Text style={styles.itemTitle}>{wagon.name}</Text>
            <Text style={styles.itemText}>ID: {wagon.id}</Text>
            <Text style={styles.itemText}>Код: {wagon.code || "—"}</Text>
            <View style={styles.itemActions}>
              <LargeActionButton
                label="Редактировать"
                variant="secondary"
                onPress={() => {
                  setEditingId(wagon.id);
                  form.reset({
                    name: wagon.name,
                    code: wagon.code,
                    description: wagon.description,
                    capacityKg: wagon.capacityKg,
                    innerLengthMm: wagon.innerLengthMm,
                    innerWidthMm: wagon.innerWidthMm,
                    innerHeightMm: wagon.innerHeightMm,
                  });
                }}
              />
              <LargeActionButton label="Удалить" variant="danger" onPress={() => void wagonsRepo.archive(wagon.id)} />
            </View>
          </View>
        ))}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: typography.heading,
    fontWeight: "800",
  },
  list: {
    gap: spacing.md,
  },
  item: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  itemTitle: {
    color: palette.text,
    fontSize: typography.heading,
    fontWeight: "800",
  },
  itemText: {
    color: palette.textMuted,
    fontSize: typography.bodySmall,
  },
  itemActions: {
    gap: spacing.sm,
  },
});
