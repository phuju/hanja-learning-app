# HanjaPath — PRD

## Summary
An Expo mobile app for studying Korean Hanja (한자) across 9 certification levels (8급 → 3급). Word-first learning: characters are taught through the Korean words they appear in. Animated stroke order via HanziWriter in WebView. Fully offline — all data bundled, progress in AsyncStorage.

## Data
- `src/data/global_characters.json` — **1,301 characters** shaped `{id, hanja, 훈, 음, levels[], english, radical, radical_meaning, strokes}` (source: user-provided).
- `src/data/global_words.json` — **295 words** shaped `{id, word, hanja, hanja_array[], meaning, levels[], english}` (source: user-provided).
- Levels: 8급(30), 7급(20), 6급(20), 준5급(81), 5급(150), 준4급(200), 4급(200), 준3급(300), 3급(300).

## Architecture
- **Expo Router** (file-based routing). Stack navigation, Home is the hub (no tabs — matches user's design).
- `src/utils/activity.js` — storage utility (user-provided): streak, activity log, studied list, daily-path plan, quiz scoring.
- `@react-native-async-storage/async-storage` for all persistence.
- `react-native-webview` renders HanziWriter from CDN (`hanzi-writer@3.5`).
- `react-native-gesture-handler` for horizontal swipe between characters.

## Screens
| Route | File | Description |
|-------|------|-------------|
| `/` | `app/index.js` | Home: 漢字 Path logo, 3 stat cards, Daily Path CTA, Search, 9 level cards + per-level quiz |
| `/character` | `app/character.js` | **Polished** study card: 米字格 writer grid, accent-color radical strokes, 음 pill, toolbar (radical/strokes/save), related words with current-hanja highlight, prev/next nav, swipe-to-advance |
| `/practice` | `app/practice.js` | HanziWriter quiz mode with hint + replay |
| `/quiz` | `app/quiz.js` | 3 question types: hanja→meaning, meaning→hanja, word→hanja; green/red reveal; results with retry-wrong |
| `/daily` | `app/daily.js` | 3-step daily path: Review saved + Learn 5 new + Quiz |
| `/saved` | `app/saved.js` | Bookmarked characters with Start Review |
| `/studied` | `app/studied.js` | All characters viewed |
| `/search` | `app/search.js` | Hanja / 훈 / 음 / English / word search with relevance scoring |
| `/activity` | `app/activity.js` | Streak, longest streak, week dots, today metrics, recent days |

## Storage keys
`savedCharacters`, `studiedCharacters`, `streak`, `longestStreak`, `lastStudyDate`, `totalStudied`, `studyActivityLog`, `dailyPathPlan`, `dailyPathLearnedCharacters`.

## Design
Warm minimal. BG `#f7f3ee`, accent `#c97a3a`, highlight `#fef3ea`, dark `#1a1a1a`, white cards, soft shadows, 米字格 guide lines on the writer panel.

## Known limitations
- WebView-based HanziWriter: only renders on real iOS/Android devices (web preview shows a placeholder).
- Web AsyncStorage uses IndexedDB polyfill.
