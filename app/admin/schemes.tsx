import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FormField } from "@/src/components/FormField";
import { LargeActionButton } from "@/src/components/LargeActionButton";
import { Page } from "@/src/components/Page";
import { usePackageTypesRepo } from "@/src/repositories/packageTypesRepo";
import { useSchemesRepo } from "@/src/repositories/schemesRepo";
import { useWagonsRepo } from "@/src/repositories/wagonsRepo";
import type { LoadingSchemeTierRecord, PackageTypeRecord, WagonRecord } from "@/src/types/domain";
import { palette, radius, spacing, typography } from "@/src/theme";
import { schemeFormSchema, type SchemeFormValues } from "@/src/utils/validation";

const initialValues: SchemeFormValues = {
  groupKey: "",
  name: "",
  description: "",
  imageKey: "scheme-inline-01.png",
  tiersCount: 1,
  tierOrderNumber: 1,
  wagonId: "",
  packageTypeId: "",
  instructionText: "",
  tierNote: "",
  isActive: true,
};

export default function SchemesAdminScreen() {
  const schemesRepo = useSchemesRepo();
  const wagonsRepo = useWagonsRepo();
  const packageTypesRepo = usePackageTypesRepo();
  const [items, setItems] = useState<LoadingSchemeTierRecord[]>([]);
  const [wagons, setWagons] = useState<WagonRecord[]>([]);
  const [packageTypes, setPackageTypes] = useState<PackageTypeRecord[]>([]);
  const [editingId, setEditingId] = useState<string>();
  const form = useForm<any>({
    resolver: zodResolver(schemeFormSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    const schemeSubscription = schemesRepo.observeAllTiers().subscribe({
      next: setItems,
      error: () => setItems([]),
    });
    const wagonSubscription = wagonsRepo.observeAll().subscribe({
      next: setWagons,
      error: () => setWagons([]),
    });
    const packageSubscription = packageTypesRepo.observeAll().subscribe({
      next: setPackageTypes,
      error: () => setPackageTypes([]),
    });
    return () => {
      schemeSubscription.unsubscribe();
      wagonSubscription.unsubscribe();
      packageSubscription.unsubscribe();
    };
  }, [packageTypesRepo, schemesRepo, wagonsRepo]);

  const isActive = form.watch("isActive");

  return (
    <Page title="Схемы погрузки" subtitle="Каждая запись описывает отдельный ярус и объединяется через groupKey.">
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{editingId ? "Редактирование яруса" : "Новый ярус схемы"}</Text>
        <Controller control={form.control} name="groupKey" render={({ field, fieldState }) => <FormField label="Group key" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />} />
        <Controller control={form.control} name="name" render={({ field, fieldState }) => <FormField label="Название схемы" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />} />
        <Controller control={form.control} name="description" render={({ field, fieldState }) => <FormField label="Описание" value={field.value ?? ""} onChangeText={field.onChange} error={fieldState.error?.message} multiline />} />
        <Controller control={form.control} name="imageKey" render={({ field, fieldState }) => <FormField label="Ключ изображения" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />} />
        <Controller control={form.control} name="tiersCount" render={({ field, fieldState }) => <FormField label="Количество ярусов" value={String(field.value)} onChangeText={field.onChange} error={fieldState.error?.message} keyboardType="numeric" />} />
        <Controller control={form.control} name="tierOrderNumber" render={({ field, fieldState }) => <FormField label="Номер текущего яруса" value={String(field.value)} onChangeText={field.onChange} error={fieldState.error?.message} keyboardType="numeric" />} />
        <Controller control={form.control} name="wagonId" render={({ field, fieldState }) => <FormField label="ID вагона" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />} />
        <Controller control={form.control} name="packageTypeId" render={({ field, fieldState }) => <FormField label="ID типа пакета" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />} />
        <Controller control={form.control} name="instructionText" render={({ field, fieldState }) => <FormField label="Инструкция по ярусу" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} multiline />} />
        <Controller control={form.control} name="tierNote" render={({ field, fieldState }) => <FormField label="Примечание" value={field.value ?? ""} onChangeText={field.onChange} error={fieldState.error?.message} multiline />} />
        <Pressable style={[styles.toggle, isActive ? styles.toggleActive : null]} onPress={() => form.setValue("isActive", !isActive)}>
          <Text style={styles.toggleText}>{isActive ? "Схема активна" : "Схема отключена"}</Text>
        </Pressable>
        <LargeActionButton
          label={editingId ? "Сохранить ярус" : "Создать ярус"}
          onPress={form.handleSubmit(async (values) => {
            const parsed = schemeFormSchema.parse(values);
            await schemesRepo.saveTier(
              {
                id: editingId ?? `scheme-tier-${Date.now()}`,
                ...parsed,
              },
              editingId,
            );
            setEditingId(undefined);
            form.reset(initialValues);
          })}
        />
      </View>

      <View style={styles.referenceCard}>
        <Text style={styles.sectionTitle}>Справка по ID</Text>
        <Text style={styles.referenceLabel}>Вагоны:</Text>
        {wagons.map((wagon) => (
          <Text key={wagon.id} style={styles.referenceText}>
            {wagon.id} — {wagon.name}
          </Text>
        ))}
        <Text style={styles.referenceLabel}>Типы пакетов:</Text>
        {packageTypes.map((item) => (
          <Text key={item.id} style={styles.referenceText}>
            {item.id} — Пакет №{item.packageTypeNumber}, вариант {item.constructionVariant}
          </Text>
        ))}
      </View>

      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.itemTitle}>
              {item.name} · {item.groupKey}
            </Text>
            <Text style={styles.itemText}>
              Ярус {item.tierOrderNumber}/{item.tiersCount}
            </Text>
            <Text style={styles.itemText}>
              {item.wagonId} / {item.packageTypeId}
            </Text>
            <View style={styles.itemActions}>
              <LargeActionButton
                label="Редактировать"
                variant="secondary"
                onPress={() => {
                  setEditingId(item.id);
                  form.reset({ ...item });
                }}
              />
              <LargeActionButton label="Удалить" variant="danger" onPress={() => void schemesRepo.archiveTier(item.id)} />
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
  toggle: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  toggleActive: {
    borderColor: palette.success,
  },
  toggleText: {
    color: palette.text,
    fontWeight: "700",
  },
  referenceCard: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  referenceLabel: {
    color: palette.accent,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  referenceText: {
    color: palette.textMuted,
    fontSize: typography.bodySmall,
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
