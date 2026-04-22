import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import {
  getDaily,
  setDaily,
  getSaved,
  getStudied,
  todayStr,
  type DailyPlan,
} from "../../src/lib/storage";
import { dateSeed, getCharById, pickNewForToday } from "../../src/lib/data";

export default function DailyScreen() {
  const router = useRouter();
  const [plan, setPlan] = useState<DailyPlan | null>(null);

  const ensurePlan = useCallback(async () => {
    const today = todayStr();
    let p = await getDaily();
    if (!p || p.date !== today) {
      const studied = await getStudied();
      const saved = await getSaved();
      const newIds = pickNewForToday(studied, 5, dateSeed(today));
      const reviewIds = saved.slice(0, 10); // cap at 10
      p = {
        date: today,
        newIds,
        reviewIds,
        learnedIds: [],
        reviewedIds: [],
        quizDone: false,
      };
      await setDaily(p);
    }
    setPlan(p);
  }, []);

  useFocusEffect(
    useCallback(() => {
      ensurePlan();
    }, [ensurePlan]),
  );

  if (!plan) {
    return <SafeAreaView style={styles.safe} />;
  }

  const learnedCount = plan.learnedIds.length;
  const reviewedCount = plan.reviewedIds.length;
  const totalSteps = plan.newIds.length + plan.reviewIds.length + 1;
  const doneSteps =
    learnedCount + reviewedCount + (plan.quizDone ? 1 : 0);
  const pct = totalSteps === 0 ? 0 : Math.round((doneSteps / totalSteps) * 100);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="daily-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.overline}>DAILY PATH</Text>
        <Text style={styles.title}>{plan.date}</Text>
        <Text style={styles.sub}>Keep a steady rhythm. {pct}% complete.</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>

        {/* Review saved */}
        <Section
          title="1 · Review saved"
          subtitle={
            plan.reviewIds.length === 0
              ? "No saved characters yet. Save some from browsing."
              : `${reviewedCount} / ${plan.reviewIds.length} reviewed`
          }
        >
          {plan.reviewIds.length === 0 ? (
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => router.push("/(tabs)/levels")}
              testID="daily-go-levels"
            >
              <Text style={styles.ghostBtnText}>Browse levels</Text>
              <Feather name="arrow-right" size={16} color={colors.accent} />
            </TouchableOpacity>
          ) : (
            <View style={styles.chipGrid}>
              {plan.reviewIds.map((id) => {
                const c = getCharById(id);
                if (!c) return null;
                const done = plan.reviewedIds.includes(id);
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.charChip, done && styles.charChipDone]}
                    onPress={() =>
                      router.push(
                        `/character/${encodeURIComponent(id)}?daily=review`,
                      )
                    }
                    testID={`daily-review-${id}`}
                  >
                    <Text style={styles.chipHanja}>{c.hanja}</Text>
                    <Text style={styles.chipMeta}>{c.reading}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Section>

        {/* Learn 5 new */}
        <Section
          title="2 · Learn 5 new"
          subtitle={`${learnedCount} / ${plan.newIds.length} learned`}
        >
          <View style={styles.chipGrid}>
            {plan.newIds.map((id) => {
              const c = getCharById(id);
              if (!c) return null;
              const done = plan.learnedIds.includes(id);
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.charChip, done && styles.charChipDone]}
                  onPress={() =>
                    router.push(
                      `/character/${encodeURIComponent(id)}?daily=new`,
                    )
                  }
                  testID={`daily-new-${id}`}
                >
                  <Text style={styles.chipHanja}>{c.hanja}</Text>
                  <Text style={styles.chipMeta}>
                    {c.reading} · {c.level}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* Quiz */}
        <Section
          title="3 · Quiz"
          subtitle={plan.quizDone ? "Done ✓" : "10 questions · mixed"}
        >
          <TouchableOpacity
            style={[styles.primaryBtn, plan.quizDone && { opacity: 0.6 }]}
            onPress={() => router.push("/quiz?mode=daily")}
            testID="daily-quiz-btn"
          >
            <Feather name="target" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>
              {plan.quizDone ? "Retake quiz" : "Start quiz"}
            </Text>
          </TouchableOpacity>
        </Section>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSub}>{subtitle}</Text>
      <View style={{ marginTop: spacing.md }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  overline: { ...T.overline, color: colors.accent, marginBottom: 4 },
  title: { ...T.h1, color: colors.textPrimary },
  sub: { ...T.body, color: colors.textSecondary, marginTop: 6 },
  progressTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.card,
  },
  sectionTitle: { ...T.h3, color: colors.textPrimary },
  sectionSub: { ...T.caption, color: colors.textSecondary, marginTop: 4 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  charChip: {
    backgroundColor: colors.highlight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    minWidth: 86,
  },
  charChipDone: {
    backgroundColor: "#E4EFE4",
    borderWidth: 1,
    borderColor: colors.success,
  },
  chipHanja: { fontSize: 32, fontWeight: "300", color: colors.textPrimary },
  chipMeta: { ...T.caption, color: colors.textSecondary, marginTop: 4 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    gap: 10,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  ghostBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ghostBtnText: { ...T.body, color: colors.accent, fontWeight: "600" },
});
