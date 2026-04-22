import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  colors,
  spacing,
  radius,
  type as T,
} from "../../src/lib/theme";
import { getCharsByLevel } from "../../src/lib/data";
import type { Level } from "../../src/lib/theme";

const { width: SCREEN_W } = Dimensions.get("window");

export default function BrowseLevel() {
  const router = useRouter();
  const params = useLocalSearchParams<{ level: string }>();
  const level = decodeURIComponent(String(params.level || "8급")) as Level;
  const chars = useMemo(() => getCharsByLevel(level), [level]);
  const [idx, setIdx] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setIdx(i);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="browse-screen">
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          testID="browse-back"
        >
          <Feather name="chevron-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.levelTitle}>{level}</Text>
          <Text style={styles.counter}>
            {chars.length === 0 ? 0 : idx + 1} / {chars.length}
          </Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      {chars.length === 0 ? (
        <View style={styles.center}>
          <Text style={T.body}>No characters for this level yet.</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={chars}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={onMomentumEnd}
          renderItem={({ item }) => (
            <View style={[styles.page, { width: SCREEN_W }]}>
              <View style={styles.card}>
                <Text style={styles.hanja}>{item.hanja}</Text>
                <Text style={styles.meaning}>{item.meaning}</Text>
                <Text style={styles.reading}>
                  {item.hun} {item.reading}
                </Text>
                <View style={styles.strokeRow}>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaLabel}>Radical</Text>
                    <Text style={styles.metaVal}>{item.radical}</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaLabel}>Strokes</Text>
                    <Text style={styles.metaVal}>{item.strokes}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.openBtn}
                  onPress={() =>
                    router.push(`/character/${encodeURIComponent(item.id)}`)
                  }
                  testID={`browse-open-${item.id}`}
                >
                  <Text style={styles.openBtnText}>Open detail</Text>
                  <Feather name="arrow-right" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>Swipe to next character →</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  levelTitle: { ...T.h2, color: colors.textPrimary, textAlign: "center" },
  counter: { ...T.caption, color: colors.textSecondary, textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  page: {
    padding: spacing.lg,
    alignItems: "center",
  },
  card: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    shadowColor: "#2D2824",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  hanja: {
    fontSize: 160,
    lineHeight: 180,
    fontWeight: "300",
    color: colors.textPrimary,
  },
  meaning: {
    ...T.h2,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  reading: {
    ...T.bodyLarge,
    color: colors.textSecondary,
    marginTop: 6,
  },
  strokeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  metaChip: {
    backgroundColor: colors.highlight,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: "center",
    minWidth: 100,
  },
  metaLabel: { ...T.caption, color: colors.textSecondary },
  metaVal: { ...T.h3, color: colors.textPrimary, marginTop: 2 },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
    gap: 8,
  },
  openBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  hint: {
    ...T.caption,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
});
