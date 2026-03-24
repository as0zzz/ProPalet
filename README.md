# ProPalet

Offline-first мобильное приложение для подбора и прохождения схем погрузки. Проект собран на Expo SDK 55, Expo Router, TypeScript и WatermelonDB. Базовый пользовательский сценарий полностью локальный: справочники, схемы, изображения, история отчетов и экспорт в TXT/PDF работают без сети.

## Что реализовано

- подбор схемы по модели вагона и типу пакета через локальный поиск;
- хранение справочников, схем, истории отчетов и настроек в WatermelonDB;
- wizard по ярусам для многоярусных схем;
- генерация локального отчета, сохранение в БД, экспорт в TXT/PDF и share;
- история отчетов с повторным экспортом;
- админ-раздел для CRUD по вагонам, типам пакетов, схемам и инвентарю;
- идемпотентный demo-seed;
- производственный UI-режим с крупными контролами.

## Структура

- `app/` — маршруты Expo Router;
- `src/db/` — инициализация БД, schema, migrations, seed;
- `src/models/` — WatermelonDB models;
- `src/repositories/` — query/observe и CRUD;
- `src/services/` — seed orchestration, report builder, export;
- `src/components/` — UI-компоненты;
- `assets/schemes/` — локальные изображения схем;
- `assets/seeds/` — seed manifest.

## Установка

```bash
npm install
```

## Запуск

Для этого проекта нужен именно development build. `Expo Go` не подходит, потому что WatermelonDB использует нативные зависимости.

```bash
npm run start
```

### Android

```bash
npm run prebuild
npm run android
```

### iOS

На macOS:

```bash
npm run prebuild
npx pod-install ios
npm run ios
```

## Почему не Expo Go

- WatermelonDB требует нативной интеграции;
- проект ориентирован на Expo Development Build;
- seed, локальная БД и export-сценарии должны работать в полном native runtime.

## Первый запуск и seed

- при старте приложение проверяет локальную БД;
- если версия seed не совпадает, выполняется `seedService.bootstrap(...)`;
- demo-seed находится в `src/db/seed.ts` и разбит на модули в `src/db/seedData/`;
- версия seed дублируется в `assets/seeds/manifest.json`;
- повторный запуск seed не дублирует записи, а обновляет существующие по `id`.

## Отчеты

- текстовая модель отчета собирается в `src/services/reportBuilder.ts`;
- TXT и PDF формируются локально через `src/services/exportService.ts`;
- пути к экспортированным файлам сохраняются в `loading_reports`;
- история повторно экспортирует уже сохраненный отчет без сервера.

## Как добавить свои схемы

1. Положите изображения в `assets/schemes/`.
2. Обновите `src/utils/assets.ts`, чтобы новый `imageKey` резолвился в локальный asset.
3. Добавьте записи схем в `src/db/seedData/loadingSchemes.ts`.
4. Добавьте связи с инвентарем в `src/db/seedData/inventory.ts`.
5. При необходимости увеличьте `seedVersion` в `src/utils/constants.ts`.
6. Перезапустите приложение или используйте переинициализацию seed из админки.

## Как добавить свои справочники

- вагоны: `src/db/seedData/wagons.ts`
- типы пакетов: `src/db/seedData/packageTypes.ts`
- инвентарь и связи: `src/db/seedData/inventory.ts`

## Проверка

Статическая проверка:

```bash
npm run typecheck
```

## Замечания по native setup

- в проекте уже подключены `expo-dev-client`, `expo-router` и `expo-build-properties`;
- для Android задан `minSdkVersion: 24`;
- для iOS указан `deploymentTarget: 15.1`;
- после изменения нативных зависимостей нужен повторный `npm run prebuild`.
