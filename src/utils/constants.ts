export const APP_NAME = "ProPalet";
export const DEMO_SEED_VERSION = "2026.03.24";
export const REPORTS_DIRECTORY = "propalet-reports";
export const DICTIONARIES_DIRECTORY = "propalet-dictionaries";
export const ADMIN_PIN = "2580";
export const ADMIN_GESTURE_TAPS = 7;
export const ADMIN_REVEAL_DURATION_MS = 15000;

export const DB_TABLES = {
  wagons: "wagons",
  packageTypes: "package_types",
  loadingSchemes: "loading_schemes",
  inventoryItems: "inventory_items",
  schemeInventories: "scheme_inventories",
  loadingReports: "loading_reports",
  appSettings: "app_settings",
  seedMeta: "seed_meta",
  auditLogs: "audit_logs",
  syncQueue: "sync_queue",
} as const;

export const APP_SETTING_KEYS = {
  productionUiEnabled: "production_ui_enabled",
  seedVersion: "seed_version",
  initializedAt: "initialized_at",
} as const;

export const UI_COPY = {
  emptyQuery: "Введите запрос, чтобы начать подбор схем.",
  nothingFound: "Совпадений не найдено. Проверьте справочник или измените запрос.",
  choosePackageType: "Выберите тип пакета, чтобы увидеть подходящие схемы.",
  noSchemes: "Для выбранной комбинации схемы пока не заведены.",
  loading: "Подготавливаем локальные данные...",
} as const;
