import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  colors,
  spacing,
  radius,
  shadows,
  type as T,
} from "../src/lib/theme";
import { CHARACTERS, WORDS } from "../src/lib/data";
import { recordQuiz, getDaily, setDaily } from "../src/lib/storage";

type QType = "hanja-to-meaning" | "meaning-to-hanja" | "word-to-hanja";

type Question = {
  type: QType;
  prompt: string;
  promptLabel: string;
  options: string[];
  answer: string;
  annotation?: string;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickUnique<T>(pool: T[], n: number, exclude: T[] = []): T[] {
  const filtered = pool.filter((p) => !exclude.includes(p));
  return shuffle(filtered).slice(0, n);
}

function buildQuestions(count = 10): Question[] {
  const qs: Question[] = [];
  const meanings = CHARACTERS.map((c) => c.meaning);
  const hanjas = CHARACTERS.map((c) => c.hanja);

  for (let i = 0; i < count; i++) {
    const type: QType =
      i % 3 === 0
        ? "hanja-to-meaning"
        : i % 3 === 1
          ? "meaning-to-hanja"
          : "word-to-hanja";

    if (type === "hanja-to-meaning") {
      const c = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
      const distractors = pickUnique(meanings, 3, [c.meaning]);
      qs.push({
        type,
        prompt: c.hanja,
        promptLabel: "What does this mean?",
        options: shuffle([c.meaning, ...distractors]),
        answer: c.meaning,
        annotation: `${c.hun} ${c.reading}`,
      });
    } else if (type === "meaning-to-hanja") {
      const c = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
      const distractors = pickUnique(hanjas, 3, [c.hanja]);
      qs.push({
        type,
        prompt: c.meaning,
        promptLabel: "Pick the hanja",
        options: shuffle([c.hanja, ...distractors]),
        answer: c.hanja,
        annotation: `${c.hun} ${c.reading}`,
      });
    } else {
      // word-to-hanja: given the korean word, pick the hanja writing
      const wordsWithChars = WORDS.filter(
        (w) => w.hanja.length >= 2 && w.chars.length > 0,
      );
      const w =
        wordsWithChars[Math.floor(Math.random() * wordsWithChars.length)];
      const distractors = pickUnique(
        WORDS.map((x) => x.hanja).filter((h) => h.length === w.hanja.length),
        3,
        [w.hanja],
      );
      qs.push({
        type,
        prompt: w.word,
        promptLabel: "Pick the hanja writing",
        options: shuffle([w.hanja, ...distractors]),
        answer: w.hanja,
        annotation: w.meaning,
      });
    }
  }
  return qs;
}

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = String(params.mode || "mixed");
  const questions = useMemo(() => buildQuestions(10), []);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[i];

  const pick = async (opt: string) => {
    if (picked) return;
    setPicked(opt);
    const isCorrect = opt === q.answer;
    if (isCorrect) setCorrectCount((c) => c + 1);
    await recordQuiz(isCorrect);
    Haptics.notificationAsync(
      isCorrect
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    ).catch(() => {});
  };

  const next = async () => {
    if (i + 1 >= questions.length) {
      setDone(true);
      if (mode === "daily") {
        const plan = await getDaily();
        if (plan) {
          plan.quizDone = true;
          await setDaily(plan);
        }
      }
      return;
    }
    setI(i + 1);
    setPicked(null);
  };

  if (done) {
    const pct = Math.round((correctCount / questions.length) * 100);
    return (
      <SafeAreaView style={styles.safe} edges={["top"]} testID="quiz-done">
        <View style={styles.center}>
          <Feather name="award" size={48} color={colors.accent} />
          <Text style={styles.doneTitle}>Well done</Text>
          <Text style={styles.donePct}>
            {correctCount} / {questions.length} · {pct}%
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.back()}
            testID="quiz-finish"
          >
            <Text style={styles.primaryBtnText}>Finish</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isHanjaOption =
    q.type === "meaning-to-hanja" || q.type === "word-to-hanja";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="quiz-screen">
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          testID="quiz-close"
        >
          <Feather name="x" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.counter}>
          {i + 1} / {questions.length}
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${(i / questions.length) * 100}%` },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.promptLabel}>{q.promptLabel}</Text>
        <View style={styles.promptBox}>
          <Text
            style={[
              styles.prompt,
              q.type === "hanja-to-meaning" && styles.promptHanja,
              q.type === "word-to-hanja" && styles.promptKorean,
            ]}
          >
            {q.prompt}
          </Text>
          {picked && q.annotation && (
            <Text style={styles.annotation}>{q.annotation}</Text>
          )}
        </View>

        <View style={styles.options}>
          {q.options.map((opt, idx) => {
            const isAnswer = opt === q.answer;
            const isPicked = picked === opt;
            const revealed = picked !== null;
            const style = [
              styles.option,
              revealed && isAnswer && styles.optionCorrect,
              revealed && isPicked && !isAnswer && styles.optionWrong,
            ];
            return (
              <TouchableOpacity
                key={idx}
                style={style}
                disabled={revealed}
                onPress={() => pick(opt)}
                activeOpacity={0.85}
                testID={`quiz-option-${idx}`}
              >
                <Text
                  style={[
                    styles.optionText,
                    isHanjaOption && styles.optionHanja,
                    revealed && isAnswer && styles.optionTextLight,
                    revealed && isPicked && !isAnswer && styles.optionTextLight,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {picked && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={next}
            testID="quiz-next"
          >
            <Text style={styles.primaryBtnText}>
              {i + 1 >= questions.length ? "Finish" : "Next question"}
            </Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </ScrollView>
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
  counter: { ...T.caption, color: colors.textSecondary, fontWeight: "600" },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.accent },
  content: { padding: spacing.lg, gap: spacing.lg },
  promptLabel: {
    ...T.overline,
    color: colors.accent,
    textAlign: "center",
  },
  promptBox: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    alignItems: "center",
    ...shadows.card,
  },
  prompt: { ...T.h1, color: colors.textPrimary, textAlign: "center" },
  promptHanja: { fontSize: 140, lineHeight: 160, fontWeight: "300" },
  promptKorean: { fontSize: 56, lineHeight: 68 },
  annotation: {
    ...T.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  options: { gap: spacing.sm },
  option: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionCorrect: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  optionWrong: { backgroundColor: colors.error, borderColor: colors.error },
  optionText: { ...T.bodyLarge, color: colors.textPrimary, fontWeight: "600" },
  optionHanja: { fontSize: 28, fontWeight: "500" },
  optionTextLight: { color: "#fff" },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.textPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: radius.pill,
    gap: 10,
    marginTop: spacing.md,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  doneTitle: { ...T.h1, color: colors.textPrimary, marginTop: spacing.md },
  donePct: { ...T.bodyLarge, color: colors.textSecondary },
});
