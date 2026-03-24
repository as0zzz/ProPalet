import { z } from "zod";

const integerField = (label: string) =>
  z.coerce.number().int(`${label} должно быть целым числом.`);

const optionalIntegerField = (label: string) =>
  z.preprocess((value) => (value === "" || value === null || value === undefined ? undefined : value), integerField(label).optional());

const optionalNumberField = (label: string) =>
  z.preprocess((value) => (value === "" || value === null || value === undefined ? undefined : value), z.coerce.number().optional());

export const wagonFormSchema = z.object({
  name: z.string().trim().min(1, "Название модели обязательно."),
  code: z.string().trim().optional(),
  description: z.string().trim().optional(),
  capacityKg: optionalNumberField("Грузоподъемность"),
  innerLengthMm: optionalIntegerField("Внутренняя длина"),
  innerWidthMm: optionalIntegerField("Внутренняя ширина"),
  innerHeightMm: optionalIntegerField("Внутренняя высота"),
});

export const packageTypeFormSchema = z.object({
  packageTypeNumber: integerField("Номер пакета").min(1, "Номер пакета должен быть положительным."),
  constructionVariant: z
    .string()
    .trim()
    .regex(/^(I|II|III|IV|V)$/i, "Вариант конструкции должен быть в диапазоне I-V.")
    .transform((value) => value.toUpperCase()),
  nominalIngotMassKg: z.coerce.number().positive("Масса слитка должна быть положительной."),
  ingotHeightMm: integerField("Высота слитка").positive("Высота слитка должна быть положительной."),
  packageDimensions: z.string().trim().min(1, "Габариты пакета обязательны."),
  legHeightMm: integerField("Высота ножки").positive("Высота ножки должна быть положительной."),
  legBaseMm: integerField("Основание ножки").positive("Основание ножки должно быть положительным."),
  nominalPackageMassKg: z.coerce.number().positive("Масса пакета должна быть положительной."),
  packageMassDeviationKg: z.coerce.number().nonnegative("Отклонение должно быть неотрицательным."),
});

export const inventoryFormSchema = z.object({
  name: z.string().trim().min(1, "Название инвентаря обязательно."),
  quantity: integerField("Количество").positive("Количество должно быть положительным."),
  configuration: z.string().trim().min(1, "Конфигурация обязательна."),
  imageKey: z.string().trim().optional(),
  unitOfMeasure: z.string().trim().min(1, "Единица измерения обязательна."),
});

export const schemeFormSchema = z.object({
  groupKey: z.string().trim().min(1, "Ключ схемы обязателен."),
  name: z.string().trim().min(1, "Название схемы обязательно."),
  description: z.string().trim().optional(),
  imageKey: z.string().trim().min(1, "Ключ изображения обязателен."),
  tiersCount: integerField("Количество ярусов").min(1, "Количество ярусов должно быть не меньше 1."),
  tierOrderNumber: integerField("Номер яруса").min(1, "Номер яруса должен быть не меньше 1."),
  wagonId: z.string().trim().min(1, "Нужно выбрать модель вагона."),
  packageTypeId: z.string().trim().min(1, "Нужно выбрать тип пакета."),
  instructionText: z.string().trim().min(1, "Инструкция для яруса обязательна."),
  tierNote: z.string().trim().optional(),
  isActive: z.boolean(),
});

export const reportMetaSchema = z.object({
  operatorName: z.string().trim().optional(),
  operatorComment: z.string().trim().optional(),
});

export type WagonFormValues = z.infer<typeof wagonFormSchema>;
export type PackageTypeFormValues = z.infer<typeof packageTypeFormSchema>;
export type InventoryFormValues = z.infer<typeof inventoryFormSchema>;
export type SchemeFormValues = z.infer<typeof schemeFormSchema>;
export type ReportMetaValues = z.infer<typeof reportMetaSchema>;
