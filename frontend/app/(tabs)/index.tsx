import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
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
  LEVELS,
} from "../../src/lib/theme";
import { countByLevel } from "../../src/lib/data";
import {
  peekStreak,
  getStudied,
  getSaved,
  getQuizStats,
} from "../../src/lib/storage";

export default function Home() {
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [studied, setStudied] = useState(0);
  const [saved, setSaved] = useState(0);
  const [quizAcc, setQuizAcc] = useState<number | null>(null);
  const counts = countByLevel();

  const refresh = useCallback(async () => {
    const [s, st, sv, q] = await Promise.all([
      peekStreak(),
      getStudied(),
      getSaved(),
      getQuizStats(),
    ]);
    setStreak(s);
    setStudied(st.length);
    setSaved(sv.length);
    setQuizAcc(q.total > 0 ? Math.round((q.correct / q.total) * 100) : null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="home-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.overline}>HANJA STUDY</Text>
            <Text style={styles.greeting}>오늘도 한 걸음</Text>
          </View>
          <View style={styles.streakPill} testID="home-streak">
            <Feather name="zap" size={14} color={colors.accent} />
            <Text style={styles.streakText}>{streak} day</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.dailyCard,
            pressed && { opacity: 0.95 },
          ]}
          onPress={() => router.push("/(tabs)/daily")}
          testID="home-daily-card"
        >
          <Text style={styles.dailyOverline}>TODAY'S PATH</Text>
          <Text style={styles.dailyTitle}>Learn 5 · Review · Quiz</Text>
          <Text style={styles.dailySub}>
            A gentle daily rhythm to build lifelong hanja memory.
          </Text>
          <View style={styles.dailyBtn}>
            <Text style={styles.dailyBtnText}>Start daily path</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </View>
        </Pressable>

        <View style={styles.statsRow}>
          <View style={styles.statCard} testID="home-studied">
            <Text style={styles.statNum}>{studied}</Text>
            <Text style={styles.statLabel}>Studied</Text>
          </View>
          <View style={styles.statCard} testID="home-saved">
            <Text style={styles.statNum}>{saved}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statCard} testID="home-accuracy">
            <Text style={styles.statNum}>
              {quizAcc === null ? "–" : `${quizAcc}%`}
            </Text>
            <Text style={styles.statLabel}>Quiz acc.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Certification Levels</Text>
        <Text style={styles.sectionSub}>
          Browse by level · swipe through characters
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.levelsRow}
        >
          {LEVELS.map((lv) => (
            <TouchableOpacity
              key={lv}
              style={styles.levelCard}
              activeOpacity={0.8}
              onPress={() => router.push(`/browse/${encodeURIComponent(lv)}`)}
              testID={`home-level-${lv}`}
            >
              <Text style={styles.levelBig}>{lv}</Text>
              <Text style={styles.levelMeta}>
                {counts[lv] || 0} characters
              </Text>
              <Feather
                name="arrow-up-right"
                size={16}
                color={colors.accent}
                style={styles.levelArrow}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.quizCta}
          onPress={() => router.push("/quiz?mode=mixed")}
          activeOpacity={0.85}
          testID="home-quiz-cta"
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.quizCtaOverline}>QUIZ</Text>
            <Text style={styles.quizCtaTitle}>Quick practice · 10 Q</Text>
            <Text style={styles.quizCtaSub}>
              Hanja → Meaning · Meaning → Hanja · Word → Hanja
            </Text>
          </View>
          <Feather name="target" size={28} color={colors.accent} />
        </TouchableOpacity>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: spacing.lg,
  },
  overline: { ...T.overline, color: colors.accent, marginBottom: 4 },
  greeting: { ...T.h1, color: colors.textPrimary },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.highlight,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    gap: 6,
  },
  streakText: { ...T.caption, color: colors.accent, fontWeight: "700" },
  dailyCard: {
    backgroundColor: colors.textPrimary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  dailyOverline: { ...T.overline, color: colors.accentSoft, marginBottom: 12 },
  dailyTitle: {
    ...T.h2,
    color: "#FFFFFF",
    marginBottom: 6,
  },
  dailySub: {
    ...T.body,
    color: "rgba(255,255,255,0.75)",
    marginBottom: spacing.lg,
  },
  dailyBtn: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.pill,
    gap: 10,
  },
  dailyBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.card,
  },
  statNum: { ...T.h2, color: colors.textPrimary },
  statLabel: { ...T.caption, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { ...T.h3, color: colors.textPrimary, marginTop: spacing.sm },
  sectionSub: {
    ...T.caption,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  levelsRow: { gap: spacing.sm, paddingRight: spacing.lg },
  levelCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minWidth: 130,
    ...shadows.card,
  },
  levelBig: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  levelMeta: {
    ...T.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  levelArrow: { position: "absolute", top: 10, right: 10 },
  quizCta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.card,
  },
  quizCtaOverline: { ...T.overline, color: colors.accent, marginBottom: 4 },
  quizCtaTitle: { ...T.h3, color: colors.textPrimary },
  quizCtaSub: { ...T.caption, color: colors.textSecondary, marginTop: 4 },
});
