import { useEffect, useState } from "react";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

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
import { palette, spacing, typography } from "@/src/theme";
import type { WagonRecord } from "@/src/types/domain";
import { UI_COPY } from "@/src/utils/constants";

function formatWagonSelection(wagon?: WagonRecord): string | undefined {
  if (!wagon) {
    return undefined;
  }

  const params = [
    wagon.code,
    wagon.capacityKg ? `${wagon.capacityKg} кг` : undefined,
    wagon.innerLengthMm && wagon.innerWidthMm && wagon.innerHeightMm
      ? `${wagon.innerLengthMm}×${wagon.innerWidthMm}×${wagon.innerHeightMm} мм`
      : undefined,
  ].filter(Boolean);

  return params.length ? `${wagon.name} • ${params.join(" • ")}` : wagon.name;
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
          const label = `Пакет №${packageType.packageTypeNumber}, вариант ${packageType.constructionVariant}`;
          setSelectedPackageLabel(label);
          setPackageQuery(label);
        }
      }
    }

    void hydrateSelections();

    return () => {
      active = false;
    };
  }, [packageTypesRepo, selectedPackageTypeId, selectedWagonId, wagonsRepo]);

  const showSchemes = selectedWagonId && selectedPackageTypeId;

  return (
    <Page
      title="Подбор схем погрузки"
      subtitle="Полностью локальный сценарий: поиск модели вагона, типа пакета и подходящей схемы без сети.">
      <View style={styles.topActions}>
        <LargeActionButton label="История отчетов" variant="secondary" onPress={() => router.push("/reports")} />
        <LargeActionButton label="Админка" variant="secondary" onPress={() => router.push("/admin")} />
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
        onSelect={(option) => {
          selectPackageType(option.id);
          setPackageQuery(option.label);
          setSelectedPackageLabel(option.label);
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
    </Page>
  );
}

const styles = StyleSheet.create({
  topActions: {
    flexDirection: "row",
    gap: spacing.md,
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
