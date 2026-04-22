import AsyncStorage from "@react-native-async-storage/async-storage";

export const ACTIVITY_LOG_KEY = "studyActivityLog";
export const LAST_STUDY_DATE_KEY = "lastStudyDate";
export const LONGEST_STREAK_KEY = "longestStreak";
export const STREAK_KEY = "streak";
export const STUDIED_KEY = "studiedCharacters";
export const TOTAL_STUDIED_KEY = "totalStudied";

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateFromKey(key) {
  const [year, month, day] = String(key).split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function offsetDateKey(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return localDateKey(date);
}

export function parseArray(raw) {
  try {
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value : [];
  } catch (_) {
    return [];
  }
}

export function parseObject(raw) {
  try {
    const value = raw ? JSON.parse(raw) : {};
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch (_) {
    return {};
  }
}

export function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function isYesterday(lastDateKey, currentDateKey) {
  if (!lastDateKey) return false;
  const current = dateFromKey(currentDateKey);
  current.setDate(current.getDate() - 1);
  return lastDateKey === localDateKey(current);
}

export async function updateStreak(dateKey = localDateKey()) {
  const [lastDay, streakRaw, longestRaw] = await Promise.all([
    AsyncStorage.getItem(LAST_STUDY_DATE_KEY),
    AsyncStorage.getItem(STREAK_KEY),
    AsyncStorage.getItem(LONGEST_STREAK_KEY),
  ]);

  let streak = streakRaw ? parseInt(streakRaw, 10) : 0;
  let longest = longestRaw ? parseInt(longestRaw, 10) : 0;

  if (lastDay !== dateKey) {
    streak = isYesterday(lastDay, dateKey) ? streak + 1 : 1;
    longest = Math.max(longest, streak);

    await Promise.all([
      AsyncStorage.setItem(LAST_STUDY_DATE_KEY, dateKey),
      AsyncStorage.setItem(STREAK_KEY, String(streak)),
      AsyncStorage.setItem(LONGEST_STREAK_KEY, String(longest)),
    ]);
  } else if (longest < streak) {
    longest = streak;
    await AsyncStorage.setItem(LONGEST_STREAK_KEY, String(longest));
  }

  return { streak, longest };
}

export async function readActivityLog() {
  return parseObject(await AsyncStorage.getItem(ACTIVITY_LOG_KEY));
}

export async function updateActivityDay(updates = {}, dateKey = localDateKey()) {
  const log = await readActivityLog();
  const current = log[dateKey] || {};

  const next = {
    ...current,
    ...updates,
    studied: unique([
      ...(current.studied || []),
      ...(updates.studied || []),
    ]),
    studyCount: (current.studyCount || 0) + (updates.studyCountDelta || 0),
    dailyPathSteps: {
      ...(current.dailyPathSteps || {}),
      ...(updates.dailyPathSteps || {}),
    },
  };

  delete next.studyCountDelta;

  log[dateKey] = next;
  await AsyncStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(log));
  return next;
}

export async function recordStudiedCharacter(hanja) {
  if (!hanja) return;

  const today = localDateKey();
  const [studiedRaw, totalRaw] = await Promise.all([
    AsyncStorage.getItem(STUDIED_KEY),
    AsyncStorage.getItem(TOTAL_STUDIED_KEY),
  ]);
  const studied = parseArray(studiedRaw);
  const total = totalRaw ? parseInt(totalRaw, 10) : 0;

  await AsyncStorage.setItem(TOTAL_STUDIED_KEY, String(total + 1));

  if (!studied.includes(hanja)) {
    await AsyncStorage.setItem(STUDIED_KEY, JSON.stringify([...studied, hanja]));
  }

  await updateActivityDay({
    studied: [hanja],
    studyCountDelta: 1,
  }, today);
  await updateStreak(today);
}

export async function recordDailyPathActivity(completed, quizScore = null) {
  const steps = completed || {};
  const dailyPathComplete = ["review", "learn", "quiz"].every(key => steps[key]);
  const updates = {
    dailyPathSteps: steps,
    dailyPathComplete,
  };

  if (quizScore) updates.quizScore = quizScore;

  await updateActivityDay(updates);
  await updateStreak();
}

export async function recordQuizActivity(quizScore) {
  if (!quizScore) return;

  await updateActivityDay({ quizScore });
  await updateStreak();
}
