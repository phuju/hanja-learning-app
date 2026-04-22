import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, FlatList, StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import charactersData from "../src/data/global_characters.json";
import wordsData from "../src/data/global_words.json";

const ALL_CHARS  = charactersData.characters;
const ALL_WORDS  = wordsData.words;
const MAX_RESULTS = 30;

function normalizeSearchText(value) {
  return String(value ?? "").normalize("NFC").toLowerCase().trim();
}

function splitGlosses(value) {
  return normalizeSearchText(value)
    .split(/[\/,;]|(?:\s+-\s+)|(?:\s+or\s+)/)
    .map(part => part.trim())
    .filter(Boolean);
}

function isExactGloss(value, query) {
  return splitGlosses(value).includes(query);
}

function scoreCharacter(char, query) {
  const hanja = normalizeSearchText(char.hanja);
  const reading = normalizeSearchText(char["음"]);
  const meaning = normalizeSearchText(char["훈"]);
  const english = normalizeSearchText(char.english);

  if (hanja === query) return 0;
  if (isExactGloss(char.english, query)) return 1;
  if (reading === query || meaning === query) return 2;
  if (hanja.includes(query)) return 3;
  if (reading.includes(query) || meaning.includes(query)) return 4;
  if (english.startsWith(query)) return 5;
  if (english.includes(query)) return 6;
  return null;
}

function scoreWord(word, query) {
  const korean = normalizeSearchText(word.word);
  const hanja = normalizeSearchText(word.hanja);
  const meaning = normalizeSearchText(word.meaning);
  const english = normalizeSearchText(word.english);

  if (korean === query || hanja === query) return 20;
  if (korean.startsWith(query) || hanja.startsWith(query)) return 21;
  if (korean.includes(query) || hanja.includes(query)) return 22;
  if (english === query || meaning === query) return 23;
  if (english.startsWith(query) || meaning.startsWith(query)) return 24;
  if (english.includes(query) || meaning.includes(query)) return 25;
  return null;
}

function Separator() { return <View style={styles.sep} />; }

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!q) return [];

    const exactCharacters = ALL_CHARS
      .filter(c => isExactGloss(c.english, q))
      .map(c => ({ type: "char", data: c, score: 1 }));

    if (exactCharacters.length > 0) {
      return exactCharacters.slice(0, MAX_RESULTS);
    }

    const chars = ALL_CHARS
      .map(c => ({ type: "char", data: c, score: scoreCharacter(c, q) }))
      .filter(item => item.score !== null);

    const words = ALL_WORDS
      .map(w => ({ type: "word", data: w, score: scoreWord(w, q) }))
      .filter(item => item.score !== null);

    return [...chars, ...words]
      .sort((a, b) => a.score - b.score)
      .slice(0, MAX_RESULTS);
  }, [query]);

  function goToChar(hanja) {
    const char = ALL_CHARS.find(c => c.hanja === hanja);
    if (!char) return;
    router.push({
      pathname: "/character",
      params: {
        level: char.levels[0],
        hanja: char.hanja,
      }
    });
  }

  function renderItem({ item }) {
    if (item.type === "char") {
      const c = item.data;
      return (
        <TouchableOpacity style={styles.row} onPress={() => goToChar(c.hanja)} activeOpacity={0.75}>
          <Text style={styles.rowHanja}>{c.hanja}</Text>
          <View style={styles.rowBody}>
            <Text style={styles.rowMain}>{c["훈"]} · {c["음"]}</Text>
            <Text style={styles.rowSub}>{c.english || ""}</Text>
          </View>
          <Text style={styles.rowBadge}>{c.levels[0]}</Text>
        </TouchableOpacity>
      );
    } else {
      const w = item.data;
      return (
        <TouchableOpacity
          style={styles.row}
          onPress={() => goToChar(w.hanja_array[0])}
          activeOpacity={0.75}
        >
          <Text style={styles.rowWord}>{w.word}</Text>
          <View style={styles.rowBody}>
            <Text style={styles.rowMain}>{w.hanja}</Text>
            <Text style={styles.rowSub}>{w.english || w.meaning || ""}</Text>
          </View>
          <Text style={[styles.rowBadge, { backgroundColor: "#f0f4ff", color: "#5c7cfa" }]}>단어</Text>
        </TouchableOpacity>
      );
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f3ee" />

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="Search hanja, reading, or meaning…"
          placeholderTextColor="#bbb"
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {query.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>漢</Text>
          <Text style={styles.emptyText}>Search by character, reading, or English meaning</Text>
          <Text style={styles.emptyHint}>Try: 구, 九, nine, 사람, 人, person</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🤔</Text>
          <Text style={styles.emptyText}>No results for &quot;{query}&quot;</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, i) => `${item.type}-${item.data.id || i}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={Separator}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f3ee" },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  input: { flex: 1, fontSize: 17, color: "#1a1a1a" },
  clearBtn: { fontSize: 14, color: "#bbb", paddingLeft: 8 },

  list: { paddingHorizontal: 16, paddingBottom: 40 },
  sep: { height: 8 },

  row: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  rowHanja: { fontSize: 36, color: "#1a1a1a", width: 48, textAlign: "center" },
  rowWord:  { fontSize: 24, fontWeight: "600", color: "#1a1a1a", width: 48, textAlign: "center" },
  rowBody:  { flex: 1 },
  rowMain:  { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  rowSub:   { fontSize: 13, color: "#aaa", marginTop: 2 },
  rowBadge: {
    fontSize: 11, fontWeight: "600",
    color: "#c97a3a", backgroundColor: "#fef3ea",
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, overflow: "hidden",
  },

  empty: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16, color: "#ddd" },
  emptyText: {
    fontSize: 16, color: "#aaa", textAlign: "center", lineHeight: 24,
  },
  emptyHint: {
    fontSize: 13, color: "#ccc", marginTop: 10, textAlign: "center",
  },
});
