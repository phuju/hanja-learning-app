import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import * as Haptics from "expo-haptics";
import {
  colors,
  spacing,
  radius,
  shadows,
  type as T,
} from "../../src/lib/theme";
import { getCharById, getWordsForChar } from "../../src/lib/data";
import {
  isSaved,
  toggleSaved,
  markStudied,
  getDaily,
  setDaily,
  bumpStreak,
} from "../../src/lib/storage";
import StrokeOrder from "../../src/components/StrokeOrder";
import WordText from "../../src/components/WordText";

export default function CharacterDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; daily?: string }>();
  const id = decodeURIComponent(String(params.id || ""));
  const c = getCharById(id);
  const [saved, setSavedState] = useState(false);

  const refresh = useCallback(async () => {
    setSavedState(await isSaved(id));
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Mark as studied and update daily plan when viewing
  useEffect(() => {
    (async () => {
      if (!id) return;
      await markStudied(id);
      await bumpStreak();
      if (params.daily === "new" || params.daily === "review") {
        const plan = await getDaily();
        if (plan) {
          if (params.daily === "new" && !plan.learnedIds.includes(id)) {
            plan.learnedIds.push(id);
          }
          if (params.daily === "review" && !plan.reviewedIds.includes(id)) {
            plan.reviewedIds.push(id);
          }
          await setDaily(plan);
        }
      }
    })();
  }, [id, params.daily]);

  if (!c) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={T.body}>Character not found.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.accent, marginTop: 12 }}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const words = getWordsForChar(id);

  const onToggleSave = async () => {
    Haptics.selectionAsync().catch(() => {});
    const next = await toggleSaved(id);
    setSavedState(next);
  };

  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top"]}
      testID="character-detail-screen"
    >
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          testID="detail-back"
        >
          <Feather name="chevron-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.levelPill}>
          <Text style={styles.levelPillText}>{c.level}</Text>
        </View>
        <TouchableOpacity
          onPress={onToggleSave}
          style={styles.iconBtn}
          testID="detail-save"
        >
          <Feather
            name={saved ? "bookmark" : "bookmark"}
            size={22}
            color={saved ? colors.accent : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.strokeBox}>
          <StrokeOrder hanja={c.hanja} size={240} />
        </View>

        <View style={styles.card}>
          <Text style={styles.meaning}>{c.meaning}</Text>
          <View style={styles.readingRow}>
            <View style={styles.readingCol}>
              <Text style={styles.readingLabel}>훈 (meaning)</Text>
              <Text style={styles.readingVal}>{c.hun}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.readingCol}>
              <Text style={styles.readingLabel}>음 (sound)</Text>
              <Text style={styles.readingVal}>{c.reading}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipLabel}>Radical</Text>
              <Text style={styles.metaChipVal}>{c.radical}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipLabel}>Strokes</Text>
              <Text style={styles.metaChipVal}>{c.strokes}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.wordsHeader}>Learn through words</Text>
        <Text style={styles.wordsSub}>
          {words.length > 0
            ? `${c.hanja} appears in ${words.length} common Korean word${words.length > 1 ? "s" : ""}.`
            : "This character is best learned on its own."}
        </Text>

        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          {words.map((w) => (
            <View key={w.word + w.hanja} style={styles.wordRow}>
              <Text style={styles.wordKorean}>{w.word}</Text>
              <View style={{ flex: 1 }}>
                <WordText
                  text={w.hanja}
                  highlightIds={[id]}
                  baseStyle={styles.wordHanja}
                  highlightStyle={styles.wordHanjaAccent}
                />
                <Text style={styles.wordMeaning}>{w.meaning}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
    borderRadius: radius.pill,
  },
  levelPill: {
    backgroundColor: colors.highlight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  levelPillText: { ...T.caption, color: colors.accent, fontWeight: "700" },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  strokeBox: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  meaning: {
    ...T.h2,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  readingRow: { flexDirection: "row", alignItems: "center" },
  readingCol: { flex: 1, alignItems: "center" },
  readingLabel: { ...T.overline, color: colors.textSecondary, marginBottom: 4 },
  readingVal: { ...T.h3, color: colors.textPrimary },
  divider: { width: 1, height: 40, backgroundColor: colors.border },
  metaRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  metaChip: {
    flex: 1,
    backgroundColor: colors.highlight,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  metaChipLabel: { ...T.caption, color: colors.textSecondary },
  metaChipVal: { ...T.h3, color: colors.textPrimary, marginTop: 4 },
  wordsHeader: { ...T.h3, color: colors.textPrimary, marginTop: spacing.xl },
  wordsSub: { ...T.caption, color: colors.textSecondary, marginTop: 4 },
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },
  wordKorean: {
    ...T.h3,
    color: colors.textPrimary,
    minWidth: 72,
  },
  wordHanja: { ...T.body, color: colors.textSecondary, fontWeight: "500" },
  wordHanjaAccent: { color: colors.accent, fontWeight: "700" },
  wordMeaning: { ...T.caption, color: colors.textSecondary, marginTop: 2 },
});
