export function normalizeSearchTerm(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildPackageTypeLabel(number: number, variant: string): string {
  return `Пакет №${number}, вариант ${variant}`;
}
