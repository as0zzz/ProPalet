import { useEffect, useState } from "react";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { EmptyState } from "@/src/components/EmptyState";
import { LargeActionButton } from "@/src/components/LargeActionButton";
import { Page } from "@/src/components/Page";
import { SchemeCard } from "@/src/components/SchemeCard";
import { SearchAutocomplete } from "@/src/components/SearchAutocomplete";
import { useAutocomplete } from "@/src/hooks/useAutocomplete";
import { usePackageTypesRepo } from "@/src/repositories/packageTypesRepo";
import { useWagonsRepo } from "@/src/repositories/wagonsRepo";
import { useSchemes } from "@/src/hooks/useSchemes";
import { useWorkflowStore } from "@/src/state/workflowStore";
import { palette, radius, spacing, typography } from "@/src/theme";
import type { PackageTypeRecord, WagonRecord } from "@/src/types/domain";
import { ADMIN_PIN, ADMIN_UNLOCK_CODE, UI_COPY } from "@/src/utils/constants";
import { buildPackageTypeLabel } from "@/src/utils/search";

function formatWagonSelection(wagon?: WagonRecord): string | undefined {
  if (!wagon) {
    return undefined;
  }

  const params = [
    wagon.code,
    wagon.capacityKg ? `${wagon.capacityKg} кг` : undefined,
    wagon.innerLengthMm && wagon.innerWidthMm && wagon.innerHeightMm
      ? `${wagon.innerLengthMm}x${wagon.innerWidthMm}x${wagon.innerHeightMm} мм`
      : undefined,
  ].filter(Boolean);

  return params.length ? `${wagon.name} | ${params.join(" | ")}` : wagon.name;
}

function formatPackageSelection(packageType?: PackageTypeRecord): string | undefined {
  if (!packageType) {
    return undefined;
  }

  const params = [
    packageType.packageDimensions,
    `${packageType.nominalPackageMassKg} кг`,
    `${packageType.ingotHeightMm} мм`,
  ].filter(Boolean);

  const baseLabel = buildPackageTypeLabel(packageType.packageTypeNumber, packageType.constructionVariant);
  return params.length ? `${baseLabel} | ${params.join(" | ")}` : baseLabel;
}

export default function HomeScreen() {
  const wagonsRepo = useWagonsRepo();
  const packageTypesRepo = usePackageTypesRepo();
  const selectWagon = useWorkflowStore((state) => state.selectWagon);
  const selectPackageType = useWorkflowStore((state) => state.selectPackageType);
  const openScheme = useWorkflowStore((state) => state.openScheme);
  const selectedWagonId = useWorkflowStore((state) => state.selectedWagonId);
  const selectedPackageTypeId = useWorkflowStore((state) => state.selectedPackageTypeId);
  const [wagonQuery, setWagonQuery] = useState("");
  const [packageQuery, setPackageQuery] = useState("");
  const [selectedWagonLabel, setSelectedWagonLabel] = useState<string>();
  const [selectedPackageLabel, setSelectedPackageLabel] = useState<string>();
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState(false);

  const wagons = useAutocomplete(wagonQuery, wagonsRepo.observeSearch);
  const packageTypes = useAutocomplete(packageQuery, packageTypesRepo.observeSearch);
  const { schemes } = useSchemes(selectedWagonId, selectedPackageTypeId);

  useEffect(() => {
    let active = true;

    async function hydrateSelections() {
      if (selectedWagonId) {
        const wagon = await wagonsRepo.getById(selectedWagonId);
        if (active) {
          setSelectedWagonLabel(formatWagonSelection(wagon));
          if (wagon?.name) {
            setWagonQuery(wagon.name);
          }
        }
      }

      if (selectedPackageTypeId) {
        const packageType = await packageTypesRepo.getById(selectedPackageTypeId);
        if (active && packageType) {
          setSelectedPackageLabel(formatPackageSelection(packageType));
          setPackageQuery(buildPackageTypeLabel(packageType.packageTypeNumber, packageType.constructionVariant));
        }
      }
    }

    void hydrateSelections();

    return () => {
      active = false;
    };
  }, [packageTypesRepo, selectedPackageTypeId, selectedWagonId, wagonsRepo]);

  const showSchemes = selectedWagonId && selectedPackageTypeId;

  function handleAdminCodeSubmit() {
    if (wagonQuery.trim().toLowerCase() !== ADMIN_UNLOCK_CODE) {
      return;
    }

    selectWagon(undefined);
    setSelectedWagonLabel(undefined);
    setPinValue("");
    setPinError(false);
    setPinModalVisible(true);
  }

  function handlePinSubmit() {
    if (pinValue === ADMIN_PIN) {
      setPinModalVisible(false);
      setPinValue("");
      setPinError(false);
      setWagonQuery("");
      router.push("/admin");
      return;
    }

    setPinError(true);
  }

  return (
    <Page
      title="Подбор схем погрузки"
      subtitle="Полностью локальный сценарий: поиск модели вагона, типа пакета и подходящей схемы без сети.">
      <View style={styles.topActions}>
        <LargeActionButton label="История отчетов" variant="secondary" onPress={() => router.push("/reports")} />
      </View>

      <SearchAutocomplete
        label="Модель вагона"
        placeholder="Введите модель вагона"
        query={wagonQuery}
        onChangeQuery={(value) => {
          setWagonQuery(value);
          setSelectedWagonLabel(undefined);
          if (!value.trim()) {
            selectWagon(undefined);
          }
        }}
        onSubmitEditing={handleAdminCodeSubmit}
        options={wagons.options}
        loading={wagons.loading}
        selectedLabel={selectedWagonLabel}
        onSelect={async (option) => {
          selectWagon(option.id);
          setWagonQuery(option.label);
          const wagon = await wagonsRepo.getById(option.id);
          setSelectedWagonLabel(formatWagonSelection(wagon) ?? option.label);
        }}
      />

      <SearchAutocomplete
        label="Тип пакета"
        placeholder="Введите номер или вариант пакета"
        query={packageQuery}
        onChangeQuery={(value) => {
          setPackageQuery(value);
          setSelectedPackageLabel(undefined);
          if (!value.trim()) {
            selectPackageType(undefined);
          }
        }}
        options={packageTypes.options}
        loading={packageTypes.loading}
        selectedLabel={selectedPackageLabel}
        onSelect={async (option) => {
          selectPackageType(option.id);
          setPackageQuery(option.label);
          const packageType = await packageTypesRepo.getById(option.id);
          setSelectedPackageLabel(formatPackageSelection(packageType) ?? option.label);
        }}
      />

      {!wagonQuery.trim() && !packageQuery.trim() ? (
        <EmptyState title="Начните с поиска" message={UI_COPY.emptyQuery} />
      ) : null}

      {selectedWagonId && !selectedPackageTypeId ? (
        <EmptyState title="Нужен тип пакета" message={UI_COPY.choosePackageType} />
      ) : null}

      {showSchemes && !schemes.length ? <EmptyState title="Схем нет" message={UI_COPY.noSchemes} /> : null}

      {showSchemes && schemes.length ? (
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Подходящие схемы</Text>
          <FlashList
            data={schemes}
            keyExtractor={(item) => item.groupKey}
            renderItem={({ item }) => (
              <SchemeCard
                scheme={item}
                onOpen={() => {
                  openScheme(item.groupKey);
                  router.push({
                    pathname: "/schemes/[groupKey]",
                    params: { groupKey: item.groupKey },
                  });
                }}
              />
            )}
          />
        </View>
      ) : null}

      <Modal visible={pinModalVisible} transparent animationType="fade" onRequestClose={() => setPinModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPinModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <TextInput
              value={pinValue}
              onChangeText={(value) => {
                setPinValue(value);
                if (pinError) {
                  setPinError(false);
                }
              }}
              onSubmitEditing={handlePinSubmit}
              placeholder="PIN"
              placeholderTextColor={palette.textMuted}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={12}
              returnKeyType="done"
              style={[styles.pinInput, pinError ? styles.pinInputError : null]}
            />
            <LargeActionButton label="Ввод" onPress={handlePinSubmit} />
          </Pressable>
        </Pressable>
      </Modal>
    </Page>
  );
}

const styles = StyleSheet.create({
  topActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: palette.overlay,
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    backgroundColor: palette.card,
    color: palette.text,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  pinInputError: {
    borderColor: palette.danger,
  },
  listContainer: {
    minHeight: 520,
    gap: spacing.md,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: typography.title,
    fontWeight: "800",
  },
});
