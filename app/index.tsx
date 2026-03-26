import { useEffect, useRef, useState } from "react";
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
import { palette, spacing, typography } from "@/src/theme";
import type { WagonRecord } from "@/src/types/domain";
import { ADMIN_GESTURE_TAPS, ADMIN_PIN, ADMIN_REVEAL_DURATION_MS, UI_COPY } from "@/src/utils/constants";

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
  const [adminButtonVisible, setAdminButtonVisible] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState<string>();
  const [headerTapCount, setHeaderTapCount] = useState(0);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
      if (tapResetTimeoutRef.current) {
        clearTimeout(tapResetTimeoutRef.current);
      }
    };
  }, []);

  const showSchemes = selectedWagonId && selectedPackageTypeId;

  function revealAdminButton() {
    setAdminButtonVisible(true);
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
    }
    revealTimeoutRef.current = setTimeout(() => {
      setAdminButtonVisible(false);
    }, ADMIN_REVEAL_DURATION_MS);
  }

  function handleHeaderPress() {
    if (tapResetTimeoutRef.current) {
      clearTimeout(tapResetTimeoutRef.current);
    }

    setHeaderTapCount((current) => {
      const next = current + 1;
      if (next >= ADMIN_GESTURE_TAPS) {
        revealAdminButton();
        return 0;
      }
      return next;
    });

    tapResetTimeoutRef.current = setTimeout(() => {
      setHeaderTapCount(0);
    }, 1500);
  }

  function handleAdminPress() {
    setPinValue("");
    setPinError(undefined);
    setPinModalVisible(true);
  }

  function handlePinSubmit() {
    if (pinValue === ADMIN_PIN) {
      setPinModalVisible(false);
      setPinValue("");
      setPinError(undefined);
      setAdminButtonVisible(false);
      router.push("/admin");
      return;
    }

    setPinError("Неверный PIN-код.");
  }

  return (
    <Page
      title="Подбор схем погрузки"
      subtitle="Полностью локальный сценарий: поиск модели вагона, типа пакета и подходящей схемы без сети."
      onHeaderPress={handleHeaderPress}>
      <View style={styles.topActions}>
        <LargeActionButton label="История отчетов" variant="secondary" onPress={() => router.push("/reports")} />
        {adminButtonVisible ? <LargeActionButton label="Админка" variant="secondary" onPress={handleAdminPress} /> : null}
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

      <Modal visible={pinModalVisible} transparent animationType="fade" onRequestClose={() => setPinModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Вход в админку</Text>
            <Text style={styles.modalText}>Введите PIN-код.</Text>
            <TextInput
              value={pinValue}
              onChangeText={(value) => {
                setPinValue(value);
                if (pinError) {
                  setPinError(undefined);
                }
              }}
              placeholder="PIN-код"
              placeholderTextColor={palette.textMuted}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={12}
              style={styles.pinInput}
            />
            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalButton, styles.modalButtonSecondary]} onPress={() => setPinModalVisible(false)}>
                <Text style={styles.modalButtonText}>Отмена</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handlePinSubmit}>
                <Text style={styles.modalButtonText}>Войти</Text>
              </Pressable>
            </View>
          </View>
        </View>
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: {
    color: palette.text,
    fontSize: typography.title,
    fontWeight: "800",
  },
  modalText: {
    color: palette.textMuted,
    fontSize: typography.body,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    backgroundColor: palette.card,
    color: palette.text,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  pinError: {
    color: palette.danger,
    fontSize: typography.bodySmall,
    fontWeight: "700",
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  modalButtonPrimary: {
    backgroundColor: palette.accentStrong,
  },
  modalButtonSecondary: {
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalButtonText: {
    color: palette.text,
    fontSize: typography.button,
    fontWeight: "700",
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
