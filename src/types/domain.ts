export type SyncStatus = "local" | "pending" | "synced" | "error";

export type ReportStatus = "draft" | "completed" | "exported";

export interface WagonRecord {
  id: string;
  name: string;
  code?: string;
  description?: string;
  capacityKg?: number;
  innerLengthMm?: number;
  innerWidthMm?: number;
  innerHeightMm?: number;
  createdAt: number;
  updatedAt: number;
  isDeleted: boolean;
  syncStatus: SyncStatus;
  version: number;
}

export interface PackageTypeRecord {
  id: string;
  packageTypeNumber: number;
  constructionVariant: string;
  nominalIngotMassKg: number;
  ingotHeightMm: number;
  packageDimensions: string;
  legHeightMm: number;
  legBaseMm: number;
  nominalPackageMassKg: number;
  packageMassDeviationKg: number;
  createdAt: number;
  updatedAt: number;
  isDeleted: boolean;
  syncStatus: SyncStatus;
  version: number;
}

export interface LoadingSchemeTierRecord {
  id: string;
  groupKey: string;
  name: string;
  description?: string;
  imageKey: string;
  tiersCount: number;
  tierOrderNumber: number;
  wagonId: string;
  packageTypeId: string;
  instructionText: string;
  tierNote?: string;
  isActive: boolean;
  version: number;
  createdAt: number;
  updatedAt: number;
  isDeleted: boolean;
  syncStatus: SyncStatus;
}

export interface InventoryItemRecord {
  id: string;
  name: string;
  quantity: number;
  configuration: string;
  imageKey?: string;
  unitOfMeasure: string;
  createdAt: number;
  updatedAt: number;
  isDeleted: boolean;
  syncStatus: SyncStatus;
  version: number;
}

export interface SchemeInventoryRecord {
  id: string;
  loadingSchemeId: string;
  inventoryItemId: string;
  unitsCount: number;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface LoadingReportRecord {
  id: string;
  dateTime: number;
  wagonId: string;
  packageTypeId: string;
  selectedSchemeGroupKey: string;
  selectedTierIdsJson: string;
  usedInventoryJson: string;
  resultText: string;
  resultHtml: string;
  txtPath?: string;
  pdfPath?: string;
  status: ReportStatus;
  operatorComment?: string;
  operatorName?: string;
  createdAt: number;
  updatedAt: number;
  isDeleted: boolean;
  syncStatus: SyncStatus;
  version: number;
}

export interface AppSettingRecord {
  id: string;
  key: string;
  value: string;
  updatedAt: number;
}

export interface SeedMetaRecord {
  id: string;
  seedVersion: string;
  appliedAt: number;
  checksum?: string;
}

export interface AuditLogRecord {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  payloadJson: string;
  createdAt: number;
}

export interface SyncQueueRecord {
  id: string;
  entityType: string;
  entityId: string;
  operation: string;
  payloadJson: string;
  status: string;
  attempts: number;
}

export interface AutocompleteOption {
  id: string;
  label: string;
  hint?: string;
}

export interface InventoryRequirement {
  relationId: string;
  inventoryItemId: string;
  name: string;
  configuration: string;
  unitsCount: number;
  unitOfMeasure: string;
  note?: string;
  imageKey?: string;
}

export interface SchemeTierViewModel {
  id: string;
  groupKey: string;
  title: string;
  description?: string;
  imageKey: string;
  instructionText: string;
  tierNote?: string;
  tierOrderNumber: number;
  tiersCount: number;
  inventory: InventoryRequirement[];
}

export interface SchemeCardViewModel {
  groupKey: string;
  name: string;
  description?: string;
  imageKey: string;
  tiersCount: number;
  wagonId: string;
  packageTypeId: string;
}

export interface ReportInventorySummary {
  inventoryItemId: string;
  name: string;
  configuration: string;
  totalUnits: number;
  unitOfMeasure: string;
}

export interface ReportDocument {
  title: string;
  timestamp: number;
  wagonName: string;
  packageTypeLabel: string;
  schemeName: string;
  tiers: Array<{
    tierOrderNumber: number;
    instructionText: string;
    inventory: InventoryRequirement[];
  }>;
  inventorySummary: ReportInventorySummary[];
  operatorComment?: string;
  operatorName?: string;
  text: string;
  html: string;
}

export interface DictionaryExport {
  wagons: WagonRecord[];
  packageTypes: PackageTypeRecord[];
  loadingSchemes: LoadingSchemeTierRecord[];
  inventoryItems: InventoryItemRecord[];
  schemeInventory: SchemeInventoryRecord[];
  exportedAt: string;
  seedVersion: string;
}

export interface DemoSeedPayload {
  seedVersion: string;
  wagons: WagonRecord[];
  packageTypes: PackageTypeRecord[];
  loadingSchemes: LoadingSchemeTierRecord[];
  inventoryItems: InventoryItemRecord[];
  schemeInventory: SchemeInventoryRecord[];
}
