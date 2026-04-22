import charactersRaw from "../data/global_characters.json";
import wordsRaw from "../data/global_words.json";
import type { HanjaChar, HanjaWord } from "./types";
import type { Level } from "./theme";

export const CHARACTERS: HanjaChar[] = charactersRaw as HanjaChar[];
export const WORDS: HanjaWord[] = wordsRaw as HanjaWord[];

const byId = new Map<string, HanjaChar>();
CHARACTERS.forEach((c) => byId.set(c.id, c));

export function getCharById(id: string): HanjaChar | undefined {
  return byId.get(id);
}

export function getCharsByLevel(level: Level): HanjaChar[] {
  return CHARACTERS.filter((c) => c.level === level);
}

export function getWordsForChar(id: string): HanjaWord[] {
  return WORDS.filter((w) => w.chars.includes(id));
}

export function searchAll(q: string): {
  chars: HanjaChar[];
  words: HanjaWord[];
} {
  const query = q.trim().toLowerCase();
  if (!query) return { chars: [], words: [] };
  const chars = CHARACTERS.filter(
    (c) =>
      c.hanja.includes(query) ||
      c.reading.toLowerCase().includes(query) ||
      c.hun.toLowerCase().includes(query) ||
      c.meaning.toLowerCase().includes(query),
  ).slice(0, 40);
  const words = WORDS.filter(
    (w) =>
      w.word.includes(query) ||
      w.hanja.includes(query) ||
      w.meaning.toLowerCase().includes(query),
  ).slice(0, 40);
  return { chars, words };
}

export function countByLevel(): Record<string, number> {
  const map: Record<string, number> = {};
  CHARACTERS.forEach((c) => {
    map[c.level] = (map[c.level] || 0) + 1;
  });
  return map;
}

// Deterministic "pick N" for daily plan based on date seed
export function pickNewForToday(
  excludeIds: string[],
  n: number,
  seed: number,
): string[] {
  const pool = CHARACTERS.filter((c) => !excludeIds.includes(c.id)).map(
    (c) => c.id,
  );
  // simple seeded shuffle
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

export function dateSeed(dateStr: string): number {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = (h * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return h || 1;
}
