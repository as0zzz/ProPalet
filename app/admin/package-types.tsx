import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FormField } from "@/src/components/FormField";
import { LargeActionButton } from "@/src/components/LargeActionButton";
import { Page } from "@/src/components/Page";
import { usePackageTypesRepo } from "@/src/repositories/packageTypesRepo";
import type { PackageTypeRecord } from "@/src/types/domain";
import { palette, radius, spacing, typography } from "@/src/theme";
import { packageTypeFormSchema, type PackageTypeFormValues } from "@/src/utils/validation";

const initialValues: PackageTypeFormValues = {
  packageTypeNumber: 1,
  constructionVariant: "I",
  nominalIngotMassKg: 0,
  ingotHeightMm: 0,
  packageDimensions: "",
  legHeightMm: 0,
  legBaseMm: 0,
  nominalPackageMassKg: 0,
  packageMassDeviationKg: 0,
};

export default function PackageTypesAdminScreen() {
  const packageTypesRepo = usePackageTypesRepo();
  const [items, setItems] = useState<PackageTypeRecord[]>([]);
  const [editingId, setEditingId] = useState<string>();
  const form = useForm<any>({
    resolver: zodResolver(packageTypeFormSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    const subscription = packageTypesRepo.observeAll().subscribe({
      next: setItems,
      error: () => setItems([]),
    });
    return () => subscription.unsubscribe();
  }, [packageTypesRepo]);

  return (
    <Page title="Типы пакетов" subtitle="Валидация выполняется локально через RHF + Zod, ошибки показываются на русском.">
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{editingId ? "Редактирование типа" : "Новый тип пакета"}</Text>
        {(
          [
            ["packageTypeNumber", "Номер пакета"],
            ["constructionVariant", "Вариант конструкции I-V"],
            ["nominalIngotMassKg", "Масса слитка, кг"],
            ["ingotHeightMm", "Высота слитка, мм"],
            ["packageDimensions", "Габариты пакета"],
            ["legHeightMm", "Высота ножки, мм"],
            ["legBaseMm", "Основание ножки, мм"],
            ["nominalPackageMassKg", "Масса пакета, кг"],
            ["packageMassDeviationKg", "Отклонение, кг"],
          ] as const
        ).map(([name, label]) => (
          <Controller
            key={name}
            control={form.control}
            name={name}
            render={({ field, fieldState }) => (
              <FormField
                label={label}
                value={field.value ? String(field.value) : ""}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
                keyboardType={name === "constructionVariant" || name === "packageDimensions" ? "default" : "numeric"}
              />
            )}
          />
        ))}
        <LargeActionButton
          label={editingId ? "Сохранить изменения" : "Создать тип"}
          onPress={form.handleSubmit(async (values) => {
            const parsed = packageTypeFormSchema.parse(values);
            await packageTypesRepo.save(
              {
                id: editingId ?? `package-${Date.now()}`,
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
            <Text style={styles.itemTitle}>
              Пакет №{item.packageTypeNumber}, вариант {item.constructionVariant}
            </Text>
            <Text style={styles.itemText}>ID: {item.id}</Text>
            <Text style={styles.itemText}>{item.packageDimensions}</Text>
            <View style={styles.itemActions}>
              <LargeActionButton
                label="Редактировать"
                variant="secondary"
                onPress={() => {
                  setEditingId(item.id);
                  form.reset({ ...item });
                }}
              />
              <LargeActionButton label="Удалить" variant="danger" onPress={() => void packageTypesRepo.archive(item.id)} />
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
