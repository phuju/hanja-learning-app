import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  SAVED: "hanja.saved",
  STUDIED: "hanja.studied",
  STREAK: "hanja.streak",
  LAST_ACTIVE: "hanja.lastActive",
  DAILY: "hanja.daily",
  QUIZ_STATS: "hanja.quizStats",
};

export type DailyPlan = {
  date: string; // YYYY-MM-DD
  newIds: string[]; // 5 chars to learn
  reviewIds: string[]; // saved chars to review
  learnedIds: string[];
  reviewedIds: string[];
  quizDone: boolean;
};

export type QuizStats = {
  total: number;
  correct: number;
};

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function diffDays(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

async function getList(key: string): Promise<string[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

async function setList(key: string, list: string[]) {
  await AsyncStorage.setItem(key, JSON.stringify(list));
}

// Saved characters
export const getSaved = () => getList(KEYS.SAVED);
export async function toggleSaved(id: string): Promise<boolean> {
  const list = await getSaved();
  const has = list.includes(id);
  const next = has ? list.filter((x) => x !== id) : [...list, id];
  await setList(KEYS.SAVED, next);
  return !has;
}
export async function isSaved(id: string): Promise<boolean> {
  const list = await getSaved();
  return list.includes(id);
}

// Studied characters
export const getStudied = () => getList(KEYS.STUDIED);
export async function markStudied(id: string): Promise<void> {
  const list = await getStudied();
  if (!list.includes(id)) {
    list.push(id);
    await setList(KEYS.STUDIED, list);
  }
}
export async function isStudied(id: string): Promise<boolean> {
  const list = await getStudied();
  return list.includes(id);
}

// Streak
export async function getStreak(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEYS.STREAK);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

export async function getLastActive(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.LAST_ACTIVE);
}

export async function bumpStreak(): Promise<number> {
  const today = todayStr();
  const last = await getLastActive();
  let streak = await getStreak();
  if (last === today) return streak;
  if (last && diffDays(last, today) === 1) streak += 1;
  else streak = 1;
  await AsyncStorage.multiSet([
    [KEYS.STREAK, String(streak)],
    [KEYS.LAST_ACTIVE, today],
  ]);
  return streak;
}

export async function peekStreak(): Promise<number> {
  const today = todayStr();
  const last = await getLastActive();
  const streak = await getStreak();
  if (!last) return 0;
  if (last === today) return streak;
  if (diffDays(last, today) === 1) return streak; // still valid if they act today
  return 0; // broken
}

// Daily plan
export async function getDaily(): Promise<DailyPlan | null> {
  const raw = await AsyncStorage.getItem(KEYS.DAILY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DailyPlan;
  } catch {
    return null;
  }
}

export async function setDaily(plan: DailyPlan): Promise<void> {
  await AsyncStorage.setItem(KEYS.DAILY, JSON.stringify(plan));
}

// Quiz stats
export async function getQuizStats(): Promise<QuizStats> {
  const raw = await AsyncStorage.getItem(KEYS.QUIZ_STATS);
  if (!raw) return { total: 0, correct: 0 };
  try {
    return JSON.parse(raw);
  } catch {
    return { total: 0, correct: 0 };
  }
}
export async function recordQuiz(correct: boolean): Promise<void> {
  const s = await getQuizStats();
  s.total += 1;
  if (correct) s.correct += 1;
  await AsyncStorage.setItem(KEYS.QUIZ_STATS, JSON.stringify(s));
}

export async function resetAll(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
