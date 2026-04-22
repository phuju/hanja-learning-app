import type { Level } from "./theme";

export type HanjaChar = {
  id: string; // hanja itself used as id
  hanja: string;
  meaning: string; // English meaning, short
  reading: string; // Korean 음 (sound reading)
  hun: string; // Korean 훈 (meaning reading)
  radical: string;
  strokes: number;
  level: Level;
};

export type HanjaWord = {
  word: string; // Korean hangul word e.g. 학교
  hanja: string; // 學校
  meaning: string; // school
  chars: string[]; // list of hanja ids contained, e.g. ["學","校"]
};
