import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Animated, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useRef, useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import charactersData from "../src/data/global_characters.json";
import wordsData from "../src/data/global_words.json";
import {
  localDateKey, recordDailyPathActivity, recordQuizActivity,
} from "../src/utils/activity";

const PLAN_KEY = "dailyPathPlan";
const ALL_WORDS = wordsData.words;

async function saveQuizActivity(taskKey, quizScore) {
  try {
    if (!taskKey) { await recordQuizActivity(quizScore); return; }
    const raw = await AsyncStorage.getItem(PLAN_KEY);
    const plan = raw ? JSON.parse(raw) : null;
    if (!plan || plan.date !== localDateKey()) {
      await recordQuizActivity(quizScore);
      return;
    }
    const nextPlan = {
      ...plan,
      completed: { ...plan.completed, [taskKey]: true },
      quizScore,
    };
    await AsyncStorage.setItem(PLAN_KEY, JSON.stringify(nextPlan));
    await recordDailyPathActivity(nextPlan.completed, quizScore);
  } catch {
    // ignore — fall through to recordQuizActivity with current state
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(characters, optionSource = charactersData.characters) {
  return shuffle(characters).map(char => {
    const rand = Math.random();
    if (rand > 0.66) {
      const charWords = ALL_WORDS.filter(w => w.hanja_array.includes(char.hanja));
      if (charWords.length > 0) {
        const word = charWords[Math.floor(Math.random() * charWords.length)];
        const wrongWords = shuffle(ALL_WORDS.filter(w => w.hanja !== word.hanja)).slice(0, 3);
        const options = shuffle([word, ...wrongWords]).map(w => ({ ...w, _id: w.hanja }));
        return { type: "word_to_hanja", char, word, options, correctId: word.hanja };
      }
    }
    const type = rand > 0.33 ? "meaning_to_hanja" : "hanja_to_meaning";
    const pool = optionSource.filter(c => c.hanja !== char.hanja);
    const wrong = shuffle(pool).slice(0, 3);
    const options = shuffle([char, ...wrong]).map(c => ({ ...c, _id: c.hanja }));
    return { type, char, options, correctId: char.hanja };
  });
}

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const level = params.level;
  const dailyPathTask = params.dailyPathTask;

  // customList comes as JSON string through URL params
  const customList = useMemo(() => {
    if (!params.customList) return null;
    try { return JSON.parse(params.customList); } catch { return null; }
  }, [params.customList]);

  // retryWrong comes as JSON string through URL params
  const retryWrong = useMemo(() => {
    if (!params.retryWrong) return null;
    try { return JSON.parse(params.retryWrong); } catch { return null; }
  }, [params.retryWrong]);

  const retryWrongKey = Array.isArray(retryWrong)
    ? retryWrong.map(q => q?.char?.hanja).filter(Boolean).join("|")
    : "";
  const customListKey = Array.isArray(customList) ? customList.join("|") : "";

  const allChars = useMemo(() => {
    if (retryWrong) return retryWrong.map(q => q?.char).filter(Boolean);
    if (customList) {
      return customList
        .map(item => charactersData.characters.find(c => c.hanja === item))
        .filter(Boolean);
    }
    if (!level) return [];
    return charactersData.characters.filter(c =>
      c.levels.some(l => l.normalize("NFC") === level.normalize("NFC"))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryWrongKey, customListKey, level]);

  const [questions, setQuestions] = useState([]);
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState([]);
  const [done, setDone] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setQuestions(buildQuestions(allChars));
    setQi(0);
    setSelected(null);
    setScore(0);
    setWrong([]);
    setDone(false);
    fadeAnim.setValue(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryWrongKey, customListKey, level]);

  const q = questions[qi];
  if (!q || !q.char) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#f7f3ee" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#999" }}>Preparing quiz…</Text>
        </View>
      </SafeAreaView>
    );
  }

  function pick(option) {
    if (selected) return;
    const isCorrect = option._id === q.correctId;
    setSelected(option._id);
    if (isCorrect) setScore(s => s + 1);
    else setWrong(w => [...w, { question: q, picked: option }]);
    setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true })
        .start(() => {
          if (qi + 1 >= questions.length) {
            setDone(true);
          } else {
            setQi(i => i + 1);
            setSelected(null);
            Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
          }
        });
    }, 700);
  }

  function optionStyle(option) {
    if (!selected) return styles.option;
    if (option._id === q.correctId) return [styles.option, styles.optionCorrect];
    if (option._id === selected) return [styles.option, styles.optionWrong];
    return [styles.option, styles.optionDim];
  }

  function optionTextColor(option) {
    if (!selected) return "#1a1a1a";
    if (option._id === q.correctId) return "#fff";
    if (option._id === selected) return "#fff";
    return "#bbb";
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#f7f3ee" />
        <ScrollView contentContainerStyle={styles.resultsContainer}>
          <Text style={styles.resultsEmoji}>{pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "📖"}</Text>
          <Text style={styles.resultsTitle}>Quiz Complete</Text>
          <Text style={styles.resultsScore}>{score} / {questions.length}</Text>
          <Text style={styles.resultsPct}>{pct}% correct</Text>

          {wrong.length > 0 && (
            <View style={styles.wrongSection}>
              <Text style={styles.wrongTitle}>REVIEW THESE</Text>
              {wrong.map(({ question: wq, picked }, i) => (
                <View key={i} style={styles.wrongRow}>
                  <Text style={styles.wrongHanja}>{wq.char.hanja}</Text>
                  <View style={{ flex: 1 }}>
                    {wq.type === "word_to_hanja" ? (
                      <>
                        <Text style={styles.wrongCorrect}>✓ {wq.word.word} = {wq.word.hanja}</Text>
                        <Text style={styles.wrongPicked}>✗ You chose: {picked._id}</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.wrongCorrect}>✓ {wq.char["훈"]} ({wq.char["음"]}) — {wq.char.english}</Text>
                        <Text style={styles.wrongPicked}>✗ You chose: {picked["훈"]} ({picked["음"]})</Text>
                      </>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {wrong.length > 0 && (
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                const retryPayload = wrong.map(w => w.question).filter(q => q && q.char);
                router.replace({
                  pathname: "/quiz",
                  params: {
                    retryWrong: JSON.stringify(retryPayload),
                    ...(dailyPathTask ? { dailyPathTask } : {}),
                  }
                });
              }}
            >
              <Text style={styles.retryBtnText}>🔁 Retry Wrong</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={async () => {
              await saveQuizActivity(dailyPathTask, { score, total: questions.length });
              router.back();
            }}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const isWordMode = q.type === "word_to_hanja";
  const isHanjaMode = q.type === "hanja_to_meaning";

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f3ee" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.exitBtn}>✕</Text>
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(qi / questions.length) * 100}%` }]} />
        </View>
        <Text style={styles.scoreText}>{score} ✓</Text>
      </View>

      <Animated.View style={[styles.body, { opacity: fadeAnim }]}>
        <View style={styles.questionCard}>
          {isWordMode ? (
            <>
              <Text style={styles.questionLabel}>Which hanja matches this word?</Text>
              <Text style={styles.questionWord}>{q.word.word}</Text>
              <Text style={styles.questionWordMeaning}>{q.word.english || q.word.meaning}</Text>
            </>
          ) : isHanjaMode ? (
            <>
              <Text style={styles.questionLabel}>What does this character mean?</Text>
              <Text style={styles.questionHanja}>{q.char.hanja}</Text>
              <Text style={styles.questionReading}>{q.char["음"]}</Text>
            </>
          ) : (
            <>
              <Text style={styles.questionLabel}>Which character is this?</Text>
              <Text style={styles.questionMeaning}>{q.char.english}</Text>
              <Text style={styles.questionReading}>{q.char["훈"]} · {q.char["음"]}</Text>
            </>
          )}
        </View>

        <View style={styles.options}>
          {q.options.map((option, i) => (
            <TouchableOpacity key={i} style={optionStyle(option)} onPress={() => pick(option)} activeOpacity={0.8}>
              {isWordMode ? (
                <Text style={[styles.optionHanjaText, { color: optionTextColor(option) }]}>{option.hanja}</Text>
              ) : isHanjaMode ? (
                <View>
                  <Text style={[styles.optionText, { color: optionTextColor(option) }]}>{option.english}</Text>
                  <Text style={[styles.optionSubText, { color: optionTextColor(option), opacity: 0.75 }]}>
                    {option["훈"]} · {option["음"]}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.optionHanjaText, { color: optionTextColor(option) }]}>{option.hanja}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.counter}>{qi + 1} / {questions.length}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f3ee" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  exitBtn: { fontSize: 18, color: "#aaa", paddingRight: 4 },
  progressTrack: { flex: 1, height: 4, backgroundColor: "#e4dfd8", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#c97a3a", borderRadius: 2 },
  scoreText: { fontSize: 13, fontWeight: "600", color: "#c97a3a" },
  body: { flex: 1, paddingHorizontal: 20 },
  questionCard: {
    backgroundColor: "#fff", borderRadius: 24, padding: 32, alignItems: "center", marginBottom: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
  },
  questionLabel: { fontSize: 13, color: "#aaa", letterSpacing: 0.5, marginBottom: 20 },
  questionHanja: { fontSize: 96, color: "#1a1a1a", lineHeight: 110 },
  questionMeaning: { fontSize: 30, fontWeight: "700", color: "#1a1a1a", textAlign: "center" },
  questionWord: { fontSize: 52, fontWeight: "700", color: "#1a1a1a", lineHeight: 62 },
  questionWordMeaning: { fontSize: 15, color: "#c97a3a", marginTop: 6, fontWeight: "500" },
  questionReading: { fontSize: 18, color: "#aaa", marginTop: 8 },
  options: { gap: 10 },
  option: {
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e4dfd8",
    borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, alignItems: "center",
  },
  optionCorrect: { backgroundColor: "#4caf50", borderColor: "#4caf50" },
  optionWrong: { backgroundColor: "#e53935", borderColor: "#e53935" },
  optionDim: { opacity: 0.4 },
  optionText: { fontSize: 17, fontWeight: "500" },
  optionSubText: { fontSize: 13, marginTop: 2 },
  optionHanjaText: { fontSize: 28, fontWeight: "600", textAlign: "center" },
  counter: { textAlign: "center", color: "#ccc", fontSize: 13, marginTop: 20 },
  resultsContainer: { alignItems: "center", paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  resultsEmoji: { fontSize: 64, marginBottom: 16 },
  resultsTitle: { fontSize: 28, fontWeight: "700", color: "#1a1a1a" },
  resultsScore: { fontSize: 56, fontWeight: "800", color: "#c97a3a", marginTop: 8 },
  resultsPct: { fontSize: 18, color: "#aaa", marginBottom: 28 },
  wrongSection: { width: "100%", backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 20 },
  wrongTitle: { fontSize: 11, fontWeight: "700", color: "#aaa", letterSpacing: 1.6, marginBottom: 14 },
  wrongRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14,
    borderBottomWidth: 1, borderBottomColor: "#f0ece6", paddingBottom: 12,
  },
  wrongHanja: { fontSize: 36, color: "#1a1a1a", width: 44 },
  wrongCorrect: { fontSize: 14, color: "#4caf50", fontWeight: "600", marginBottom: 3 },
  wrongPicked: { fontSize: 13, color: "#e53935" },
  retryBtn: { backgroundColor: "#1a1a1a", paddingVertical: 14, paddingHorizontal: 40, borderRadius: 100, marginBottom: 12 },
  retryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  doneBtn: { backgroundColor: "#c97a3a", paddingVertical: 16, paddingHorizontal: 48, borderRadius: 100 },
  doneBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
