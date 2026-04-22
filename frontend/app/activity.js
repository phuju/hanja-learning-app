import {
  View, Text, StyleSheet, ScrollView, StatusBar, ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  dateFromKey,
  localDateKey,
  LONGEST_STREAK_KEY,
  offsetDateKey,
  parseObject,
  readActivityLog,
  STREAK_KEY,
} from "../src/utils/activity";

const PLAN_KEY = "dailyPathPlan";
const PATH_STEPS = ["review", "learn", "quiz"];

function parseNumber(value) {
  const number = parseInt(value, 10);
  return Number.isFinite(number) ? number : 0;
}

function dayTitle(key) {
  if (key === localDateKey()) return "Today";
  if (key === offsetDateKey(-1)) return "Yesterday";
  return dateFromKey(key).toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric",
  });
}

function shortDay(key) {
  return dateFromKey(key).toLocaleDateString(undefined, { weekday: "narrow" });
}

function mergePlan(day, plan, key) {
  if (!plan || plan.date !== key) return day;
  const steps = { ...(day.dailyPathSteps || {}), ...(plan.completed || {}) };
  return {
    ...day,
    dailyPathSteps: steps,
    dailyPathComplete: day.dailyPathComplete || PATH_STEPS.every(step => steps[step]),
    quizScore: day.quizScore || plan.quizScore,
  };
}

function pathStepCount(day) {
  return PATH_STEPS.filter(step => day.dailyPathSteps?.[step]).length;
}

function hasActivity(day) {
  return (day.studied?.length || 0) > 0 ||
    (day.studyCount || 0) > 0 ||
    Boolean(day.quizScore) ||
    pathStepCount(day) > 0;
}

function daySummary(day) {
  const parts = [];
  const studied = day.studied?.length || 0;
  const steps = pathStepCount(day);
  if (studied > 0) parts.push(`${studied} studied`);
  if (day.dailyPathComplete) parts.push("Daily Path complete");
  else if (steps > 0) parts.push(`${steps}/3 path steps`);
  if (day.quizScore) parts.push(`${day.quizScore.score}/${day.quizScore.total} quiz`);
  return parts.length > 0 ? parts.join(" · ") : "No study";
}

export default function ActivityScreen() {
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [activityLog, setActivityLog] = useState({});
  const [dailyPlan, setDailyPlan] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        setLoading(true);
        try {
          const [streakRaw, longestRaw, log, planRaw] = await Promise.all([
            AsyncStorage.getItem(STREAK_KEY),
            AsyncStorage.getItem(LONGEST_STREAK_KEY),
            readActivityLog(),
            AsyncStorage.getItem(PLAN_KEY),
          ]);
          const plan = parseObject(planRaw);
          if (!active) return;
          setStreak(parseNumber(streakRaw));
          setLongestStreak(Math.max(parseNumber(longestRaw), parseNumber(streakRaw)));
          setActivityLog(log);
          setDailyPlan(plan.date ? plan : null);
        } catch (_) {
          if (!active) return;
          setStreak(0);
          setLongestStreak(0);
          setActivityLog({});
          setDailyPlan(null);
        } finally {
          if (active) setLoading(false);
        }
      }
      load();
      return () => { active = false; };
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#f7f3ee" />
        <View style={styles.loading}>
          <ActivityIndicator color="#c97a3a" />
        </View>
      </SafeAreaView>
    );
  }

  const today = localDateKey();
  const weekKeys = [-6, -5, -4, -3, -2, -1, 0].map(offsetDateKey);
  const recentKeys = [0, -1, -2, -3, -4, -5, -6].map(offsetDateKey);
  const todayData = mergePlan(activityLog[today] || {}, dailyPlan, today);
  const activeDays = Object.keys(activityLog).filter(key =>
    hasActivity(mergePlan(activityLog[key] || {}, dailyPlan, key))
  ).length;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f3ee" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>STREAK</Text>
          <Text style={styles.title}>Activity</Text>
          <Text style={styles.subtitle}>Your study rhythm at a glance</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statNum}>{streak}</Text><Text style={styles.statLabel}>Current</Text></View>
          <View style={styles.statCard}><Text style={styles.statNum}>{longestStreak}</Text><Text style={styles.statLabel}>Longest</Text></View>
          <View style={styles.statCard}><Text style={styles.statNum}>{activeDays}</Text><Text style={styles.statLabel}>Active Days</Text></View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelLabel}>THIS WEEK</Text>
          <View style={styles.weekRow}>
            {weekKeys.map(key => {
              const day = mergePlan(activityLog[key] || {}, dailyPlan, key);
              const active = hasActivity(day);
              const complete = day.dailyPathComplete;
              return (
                <View key={key} style={styles.weekDay}>
                  <Text style={styles.weekLabel}>{shortDay(key)}</Text>
                  <View style={[styles.weekDot, active && styles.weekDotActive, complete && styles.weekDotComplete]}>
                    {complete ? <Text style={styles.weekCheck}>✓</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelLabel}>TODAY</Text>
          <View style={styles.todayGrid}>
            <View style={styles.todayItem}><Text style={styles.todayValue}>{todayData.studied?.length || 0}</Text><Text style={styles.todayLabel}>Studied</Text></View>
            <View style={styles.todayItem}><Text style={styles.todayValue}>{pathStepCount(todayData)}/3</Text><Text style={styles.todayLabel}>Path</Text></View>
            <View style={styles.todayItem}>
              <Text style={styles.todayValue}>{todayData.quizScore ? `${todayData.quizScore.score}/${todayData.quizScore.total}` : "—"}</Text>
              <Text style={styles.todayLabel}>Quiz</Text>
            </View>
          </View>
          <Text style={styles.todaySummary}>{daySummary(todayData)}</Text>
        </View>

        <Text style={styles.sectionLabel}>RECENT DAYS</Text>
        {recentKeys.map(key => {
          const day = mergePlan(activityLog[key] || {}, dailyPlan, key);
          const active = hasActivity(day);
          return (
            <View key={key} style={styles.dayRow}>
              <View style={[styles.dayMarker, active && styles.dayMarkerActive]} />
              <View style={styles.dayText}>
                <Text style={styles.dayTitle}>{dayTitle(key)}</Text>
                <Text style={styles.daySub}>{daySummary(day)}</Text>
              </View>
              {day.dailyPathComplete ? <Text style={styles.dayBadge}>✓</Text> : null}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f3ee" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18 },
  header: { marginBottom: 16 },
  eyebrow: { fontSize: 11, color: "#c97a3a", fontWeight: "700", letterSpacing: 1.4, marginBottom: 6 },
  title: { fontSize: 34, fontWeight: "800", color: "#1a1a1a" },
  subtitle: { fontSize: 14, color: "#999", marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 16, paddingVertical: 16, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statNum: { fontSize: 28, fontWeight: "800", color: "#1a1a1a" },
  statLabel: { fontSize: 11, color: "#aaa", marginTop: 2 },
  panel: {
    backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  panelLabel: { fontSize: 11, color: "#aaa", fontWeight: "700", letterSpacing: 1.4, marginBottom: 14 },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  weekDay: { alignItems: "center", gap: 8 },
  weekLabel: { fontSize: 12, color: "#aaa", fontWeight: "600" },
  weekDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#e4dfd8", alignItems: "center", justifyContent: "center" },
  weekDotActive: { backgroundColor: "#f5dfc4" },
  weekDotComplete: { backgroundColor: "#c97a3a" },
  weekCheck: { color: "#fff", fontSize: 15, fontWeight: "800" },
  todayGrid: { flexDirection: "row", gap: 10 },
  todayItem: { flex: 1, backgroundColor: "#f9f5f0", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  todayValue: { fontSize: 22, fontWeight: "800", color: "#1a1a1a" },
  todayLabel: { fontSize: 11, color: "#aaa", marginTop: 2 },
  todaySummary: { color: "#666", fontSize: 14, lineHeight: 20, marginTop: 14 },
  sectionLabel: { fontSize: 11, letterSpacing: 2, color: "#aaa", marginBottom: 12, marginLeft: 2 },
  dayRow: {
    backgroundColor: "#fff", borderRadius: 15, padding: 14, marginBottom: 9,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  dayMarker: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#e4dfd8" },
  dayMarkerActive: { backgroundColor: "#c97a3a" },
  dayText: { flex: 1 },
  dayTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  daySub: { fontSize: 13, color: "#999", marginTop: 2 },
  dayBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: "#fef3ea",
    color: "#c97a3a", textAlign: "center", lineHeight: 28,
    fontSize: 15, fontWeight: "800", overflow: "hidden",
  },
});
