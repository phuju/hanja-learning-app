import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import charactersData from "../src/data/global_characters.json";
import {
  localDateKey, parseArray, recordDailyPathActivity, unique,
} from "../src/utils/activity";

const ALL_CHARS = charactersData.characters;
const PLAN_KEY = "dailyPathPlan";
const LEARNED_KEY = "dailyPathLearnedCharacters";
const SAVED_KEY = "savedCharacters";
const DAILY_NEW_COUNT = 5;
const DAILY_REVIEW_COUNT = 5;

const LEVELS = ["8급","7급","6급","준5급","5급","준4급","4급","준3급","3급"];

function sameLevel(char, level) {
  return char.levels?.some(l => l.normalize("NFC") === level.normalize("NFC"));
}
function findChar(hanja) { return ALL_CHARS.find(c => c.hanja === hanja); }
function getLevelCharacters(level) { return ALL_CHARS.filter(c => sameLevel(c, level)); }

function buildPlan(savedCharacters, learnedCharacters) {
  const learnedSet = new Set(learnedCharacters);
  let level = LEVELS[LEVELS.length - 1];
  let newCharacters = [];

  for (const candidateLevel of LEVELS) {
    const candidates = getLevelCharacters(candidateLevel)
      .filter(c => !learnedSet.has(c.hanja))
      .slice(0, DAILY_NEW_COUNT);
    if (candidates.length > 0) {
      level = candidateLevel;
      newCharacters = candidates.map(c => c.hanja);
      break;
    }
  }

  const newSet = new Set(newCharacters);
  const reviewCharacters = unique([...savedCharacters, ...learnedCharacters])
    .filter(h => !newSet.has(h))
    .map(findChar)
    .filter(Boolean)
    .slice(0, DAILY_REVIEW_COUNT)
    .map(c => c.hanja);

  return {
    date: localDateKey(), level, newCharacters, reviewCharacters,
    completed: {
      review: reviewCharacters.length === 0,
      learn: newCharacters.length === 0,
      quiz: newCharacters.length + reviewCharacters.length === 0,
    },
    quizScore: null,
  };
}

function getCharacters(hanjas) { return hanjas.map(findChar).filter(Boolean); }
function formatDate() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

export default function DailyPathScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    try {
      const [planRaw, savedRaw, learnedRaw] = await Promise.all([
        AsyncStorage.getItem(PLAN_KEY),
        AsyncStorage.getItem(SAVED_KEY),
        AsyncStorage.getItem(LEARNED_KEY),
      ]);
      const savedCharacters = parseArray(savedRaw);
      const learnedCharacters = parseArray(learnedRaw);
      let nextPlan = null;
      try { nextPlan = planRaw ? JSON.parse(planRaw) : null; } catch (_) { nextPlan = null; }
      if (!nextPlan || nextPlan.date !== localDateKey()) {
        nextPlan = buildPlan(savedCharacters, learnedCharacters);
        await AsyncStorage.setItem(PLAN_KEY, JSON.stringify(nextPlan));
      }
      setPlan(nextPlan);
    } catch (_) {
      setPlan(buildPlan([], []));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadPlan(); }, [loadPlan]));

  async function completeTask(taskKey) {
    if (!plan) return null;
    const nextPlan = { ...plan, completed: { ...plan.completed, [taskKey]: true } };
    if (taskKey === "learn" && plan.newCharacters.length > 0) {
      const learnedRaw = await AsyncStorage.getItem(LEARNED_KEY);
      const learned = parseArray(learnedRaw);
      const updatedLearned = unique([...learned, ...plan.newCharacters]);
      await AsyncStorage.setItem(LEARNED_KEY, JSON.stringify(updatedLearned));
    }
    await AsyncStorage.setItem(PLAN_KEY, JSON.stringify(nextPlan));
    await recordDailyPathActivity(nextPlan.completed);
    setPlan(nextPlan);
    return nextPlan;
  }

  async function openReview() {
    if (!plan?.reviewCharacters.length) return;
    await completeTask("review");
    router.push({
      pathname: "/character",
      params: { customList: JSON.stringify(plan.reviewCharacters), listTitle: "Daily Review" }
    });
  }
  async function openLearn() {
    if (!plan?.newCharacters.length) return;
    await completeTask("learn");
    router.push({
      pathname: "/character",
      params: { customList: JSON.stringify(plan.newCharacters), listTitle: "Daily Learn" }
    });
  }
  function openQuiz() {
    const quizCharacters = unique([...(plan?.reviewCharacters ?? []), ...(plan?.newCharacters ?? [])]);
    if (quizCharacters.length === 0) return;
    router.push({
      pathname: "/quiz",
      params: { customList: JSON.stringify(quizCharacters), dailyPathTask: "quiz" }
    });
  }

  if (loading || !plan) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#f7f3ee" />
        <View style={styles.loading}><ActivityIndicator color="#c97a3a" /></View>
      </SafeAreaView>
    );
  }

  const reviewCharacters = getCharacters(plan.reviewCharacters);
  const newCharacters = getCharacters(plan.newCharacters);
  const quizCount = unique([...plan.reviewCharacters, ...plan.newCharacters]).length;
  const completedCount = ["review","learn","quiz"].filter(k => plan.completed?.[k]).length;
  const isComplete = completedCount === 3;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f3ee" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{formatDate()}</Text>
          <Text style={styles.title}>Daily Path</Text>
          <Text style={styles.subtitle}>{completedCount} of 3 steps complete</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(completedCount / 3) * 100}%` }]} />
        </View>

        {isComplete && (
          <View style={styles.completeBanner}>
            <Text style={styles.completeIcon}>✓</Text>
            <View style={styles.completeCopy}>
              <Text style={styles.completeTitle}>Path complete</Text>
              <Text style={styles.completeText}>Nice work today. Your next path refreshes tomorrow.</Text>
            </View>
          </View>
        )}

        <PathStep number="1" title="Review"
          meta={`${reviewCharacters.length} character${reviewCharacters.length === 1 ? "" : "s"}`}
          characters={reviewCharacters} done={plan.completed.review}
          disabled={reviewCharacters.length === 0} emptyText="Nothing due"
          actionText={plan.completed.review ? "Reviewed" : "Start Review"}
          onPress={openReview} />

        <PathStep number="2" title="Learn"
          meta={`${plan.level} · ${newCharacters.length} new`}
          characters={newCharacters} done={plan.completed.learn}
          disabled={newCharacters.length === 0} emptyText="All levels learned"
          actionText={plan.completed.learn ? "Studied" : "Study New"}
          onPress={openLearn} />

        <PathStep number="3" title="Quiz"
          meta={`${quizCount} question${quizCount === 1 ? "" : "s"}`}
          characters={[...reviewCharacters, ...newCharacters]}
          done={plan.completed.quiz} disabled={quizCount === 0}
          emptyText="No questions"
          actionText={plan.completed.quiz ? "Completed" : "Start Quiz"}
          onPress={openQuiz} />

        {plan.quizScore && (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>TODAY&apos;S QUIZ</Text>
            <Text style={styles.scoreValue}>{plan.quizScore.score} / {plan.quizScore.total}</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PathStep({ number, title, meta, characters, done, disabled, emptyText, actionText, onPress }) {
  return (
    <View style={[styles.stepCard, done && styles.stepCardDone]}>
      <View style={styles.stepHeader}>
        <View style={[styles.stepNumber, done && styles.stepNumberDone]}>
          <Text style={[styles.stepNumberText, done && styles.stepNumberTextDone]}>{done ? "✓" : number}</Text>
        </View>
        <View style={styles.stepTitleWrap}>
          <Text style={styles.stepTitle}>{title}</Text>
          <Text style={styles.stepMeta}>{meta}</Text>
        </View>
      </View>

      {characters.length > 0 ? (
        <View style={styles.characterStrip}>
          {characters.slice(0, 8).map(char => (
            <View key={char.hanja} style={styles.characterTile}>
              <Text style={styles.characterHanja}>{char.hanja}</Text>
              <Text style={styles.characterMeaning} numberOfLines={1}>{char.english || char["훈"]}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyLine}>{emptyText}</Text>
      )}

      <TouchableOpacity
        style={[styles.stepButton, done && styles.stepButtonDone, disabled && styles.stepButtonDisabled]}
        onPress={onPress} activeOpacity={0.78} disabled={disabled}
      >
        <Text style={[styles.stepButtonText, done && styles.stepButtonTextDone, disabled && styles.stepButtonTextDisabled]}>
          {actionText}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f3ee" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18 },
  header: { marginBottom: 14 },
  eyebrow: { fontSize: 11, color: "#c97a3a", fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 6 },
  title: { fontSize: 34, fontWeight: "800", color: "#1a1a1a" },
  subtitle: { fontSize: 14, color: "#999", marginTop: 4 },
  progressTrack: { height: 5, backgroundColor: "#e4dfd8", borderRadius: 3, overflow: "hidden", marginBottom: 18 },
  progressFill: { height: "100%", backgroundColor: "#c97a3a", borderRadius: 3 },
  completeBanner: {
    backgroundColor: "#1a1a1a", borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14,
  },
  completeIcon: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#fef3ea",
    color: "#c97a3a", textAlign: "center", lineHeight: 34, fontSize: 18, fontWeight: "800", overflow: "hidden",
  },
  completeCopy: { flex: 1 },
  completeTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  completeText: { color: "#d8d0c8", fontSize: 13, marginTop: 2, lineHeight: 18 },
  stepCard: {
    backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  stepCardDone: { borderWidth: 1.5, borderColor: "#f5dfc4" },
  stepHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 12 },
  stepNumber: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#fef3ea", alignItems: "center", justifyContent: "center" },
  stepNumberDone: { backgroundColor: "#c97a3a" },
  stepNumberText: { fontSize: 15, fontWeight: "800", color: "#c97a3a" },
  stepNumberTextDone: { color: "#fff" },
  stepTitleWrap: { flex: 1 },
  stepTitle: { fontSize: 20, fontWeight: "700", color: "#1a1a1a" },
  stepMeta: { fontSize: 12, color: "#aaa", marginTop: 2 },
  characterStrip: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  characterTile: {
    width: 64, backgroundColor: "#f9f5f0", borderRadius: 12,
    paddingVertical: 9, paddingHorizontal: 6, alignItems: "center",
  },
  characterHanja: { fontSize: 28, color: "#1a1a1a", lineHeight: 34 },
  characterMeaning: { fontSize: 10, color: "#999", marginTop: 2, maxWidth: 52 },
  emptyLine: {
    fontSize: 14, color: "#aaa", backgroundColor: "#f9f5f0", borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 14, marginBottom: 14,
  },
  stepButton: { backgroundColor: "#c97a3a", borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  stepButtonDone: { backgroundColor: "#fef3ea" },
  stepButtonDisabled: { backgroundColor: "#e4dfd8" },
  stepButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  stepButtonTextDone: { color: "#c97a3a" },
  stepButtonTextDisabled: { color: "#aaa" },
  scoreCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, alignItems: "center", marginTop: 4 },
  scoreLabel: { color: "#aaa", fontSize: 11, fontWeight: "700", letterSpacing: 1.4, marginBottom: 4 },
  scoreValue: { fontSize: 28, fontWeight: "800", color: "#c97a3a" },
});
