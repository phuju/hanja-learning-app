import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import {
  colors,
  spacing,
  radius,
  shadows,
  type as T,
} from "../../src/lib/theme";
import { getSaved, getStudied } from "../../src/lib/storage";
import { getCharById } from "../../src/lib/data";
import type { HanjaChar } from "../../src/lib/types";

type Tab = "saved" | "studied";

export default function SavedScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("saved");
  const [saved, setSaved] = useState<HanjaChar[]>([]);
  const [studied, setStudied] = useState<HanjaChar[]>([]);

  const refresh = useCallback(async () => {
    const [sv, st] = await Promise.all([getSaved(), getStudied()]);
    setSaved(
      sv.map((id) => getCharById(id)).filter(Boolean) as HanjaChar[],
    );
    setStudied(
      st.map((id) => getCharById(id)).filter(Boolean) as HanjaChar[],
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const list = tab === "saved" ? saved : studied;
  const emptyText =
    tab === "saved"
      ? "No saved characters yet. Tap the bookmark on any character to save it."
      : "No studied characters yet. Characters you read in detail show up here.";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="saved-screen">
      <View style={styles.header}>
        <Text style={styles.overline}>LIBRARY</Text>
        <Text style={styles.title}>Your characters</Text>
      </View>

      <View style={styles.tabs}>
        <TabBtn
          label={`Saved · ${saved.length}`}
          active={tab === "saved"}
          onPress={() => setTab("saved")}
          testID="saved-tab-saved"
        />
        <TabBtn
          label={`Studied · ${studied.length}`}
          active={tab === "studied"}
          onPress={() => setTab("studied")}
          testID="saved-tab-studied"
        />
      </View>

      {list.length === 0 ? (
        <View style={styles.empty}>
          <Feather
            name={tab === "saved" ? "bookmark" : "book-open"}
            size={32}
            color={colors.textMuted}
          />
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.85}
              onPress={() =>
                router.push(`/character/${encodeURIComponent(item.id)}`)
              }
              testID={`saved-row-${item.id}`}
            >
              <Text style={styles.rowHanja}>{item.hanja}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowMeaning}>{item.meaning}</Text>
                <Text style={styles.rowSub}>
                  {item.hun} {item.reading} · {item.level}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function TabBtn({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
      testID={testID}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  overline: { ...T.overline, color: colors.accent, marginBottom: 4 },
  title: { ...T.h1, color: colors.textPrimary },
  tabs: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
  tabActive: { backgroundColor: colors.textPrimary },
  tabText: { ...T.caption, color: colors.textSecondary, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
    ...shadows.card,
  },
  rowHanja: { fontSize: 36, fontWeight: "300", color: colors.textPrimary, width: 48, textAlign: "center" },
  rowMeaning: { ...T.bodyLarge, color: colors.textPrimary, fontWeight: "600" },
  rowSub: { ...T.caption, color: colors.textSecondary, marginTop: 2 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyText: {
    ...T.body,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 280,
  },
});
