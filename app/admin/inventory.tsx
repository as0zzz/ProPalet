import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FormField } from "@/src/components/FormField";
import { LargeActionButton } from "@/src/components/LargeActionButton";
import { Page } from "@/src/components/Page";
import { useInventoryRepo } from "@/src/repositories/inventoryRepo";
import type { InventoryItemRecord } from "@/src/types/domain";
import { palette, radius, spacing, typography } from "@/src/theme";
import { inventoryFormSchema, type InventoryFormValues } from "@/src/utils/validation";

const initialValues: InventoryFormValues = {
  name: "",
  quantity: 1,
  configuration: "",
  imageKey: "",
  unitOfMeasure: "шт",
};

export default function InventoryAdminScreen() {
  const inventoryRepo = useInventoryRepo();
  const [items, setItems] = useState<InventoryItemRecord[]>([]);
  const [editingId, setEditingId] = useState<string>();
  const form = useForm<any>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    const subscription = inventoryRepo.observeAll().subscribe({
      next: setItems,
      error: () => setItems([]),
    });
    return () => subscription.unsubscribe();
  }, [inventoryRepo]);

  return (
    <Page title="Инвентарь" subtitle="Позиции инвентаря используются в пошаговом экране схемы и в сводке отчета.">
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{editingId ? "Редактирование позиции" : "Новая позиция"}</Text>
        <Controller control={form.control} name="name" render={({ field, fieldState }) => <FormField label="Название" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />} />
        <Controller control={form.control} name="quantity" render={({ field, fieldState }) => <FormField label="Количество" value={String(field.value)} onChangeText={field.onChange} error={fieldState.error?.message} keyboardType="numeric" />} />
        <Controller control={form.control} name="configuration" render={({ field, fieldState }) => <FormField label="Конфигурация" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />} />
        <Controller control={form.control} name="imageKey" render={({ field, fieldState }) => <FormField label="Ключ изображения" value={field.value ?? ""} onChangeText={field.onChange} error={fieldState.error?.message} />} />
        <Controller control={form.control} name="unitOfMeasure" render={({ field, fieldState }) => <FormField label="Единица измерения" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />} />
        <LargeActionButton
          label={editingId ? "Сохранить изменения" : "Создать позицию"}
          onPress={form.handleSubmit(async (values) => {
            const parsed = inventoryFormSchema.parse(values);
            await inventoryRepo.save(
              {
                id: editingId ?? `inventory-${Date.now()}`,
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
        {items.map((item) => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            <Text style={styles.itemText}>
              {item.quantity} {item.unitOfMeasure}, {item.configuration}
            </Text>
            <Text style={styles.itemText}>ID: {item.id}</Text>
            <View style={styles.itemActions}>
              <LargeActionButton
                label="Редактировать"
                variant="secondary"
                onPress={() => {
                  setEditingId(item.id);
                  form.reset({
                    name: item.name,
                    quantity: item.quantity,
                    configuration: item.configuration,
                    imageKey: item.imageKey,
                    unitOfMeasure: item.unitOfMeasure,
                  });
                }}
              />
              <LargeActionButton label="Удалить" variant="danger" onPress={() => void inventoryRepo.archive(item.id)} />
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
