import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  colors,
  spacing,
  radius,
  shadows,
  type as T,
} from "../../src/lib/theme";
import { searchAll } from "../../src/lib/data";
import WordText from "../../src/components/WordText";

export default function SearchScreen() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const results = useMemo(() => searchAll(q), [q]);

  const combined = [
    ...results.chars.map((c) => ({ type: "char" as const, data: c })),
    ...results.words.map((w) => ({ type: "word" as const, data: w })),
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="search-screen">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.overline}>SEARCH</Text>
            <Text style={styles.title}>Find a character or word</Text>
            <View style={styles.searchRow}>
              <Feather name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="한자, 음, 훈, word, meaning…"
                placeholderTextColor={colors.textMuted}
                value={q}
                onChangeText={setQ}
                autoCorrect={false}
                autoCapitalize="none"
                testID="search-input"
              />
              {q.length > 0 && (
                <TouchableOpacity onPress={() => setQ("")} testID="search-clear">
                  <Feather name="x-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {q.trim().length === 0 ? (
            <View style={styles.empty}>
              <Feather name="search" size={28} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                Try searching 학, school, 나무, or 木.
              </Text>
            </View>
          ) : combined.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No results.</Text>
            </View>
          ) : (
            <FlatList
              data={combined}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(it, idx) =>
                it.type === "char"
                  ? `c-${it.data.id}`
                  : `w-${it.data.word}-${idx}`
              }
              contentContainerStyle={styles.list}
              renderItem={({ item }) => {
                if (item.type === "char") {
                  const c = item.data;
                  return (
                    <TouchableOpacity
                      style={styles.row}
                      activeOpacity={0.85}
                      onPress={() =>
                        router.push(`/character/${encodeURIComponent(c.id)}`)
                      }
                      testID={`search-result-char-${c.id}`}
                    >
                      <Text style={styles.hanja}>{c.hanja}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.meaning}>{c.meaning}</Text>
                        <Text style={styles.sub}>
                          {c.hun} {c.reading} · {c.level}
                        </Text>
                      </View>
                      <Feather
                        name="chevron-right"
                        size={18}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  );
                }
                const w = item.data;
                return (
                  <View
                    style={styles.row}
                    testID={`search-result-word-${w.word}`}
                  >
                    <View style={styles.wordBadge}>
                      <Feather name="type" size={16} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.meaning}>
                        {w.word}{" "}
                        <WordText
                          text={w.hanja}
                          highlightIds={[]}
                          baseStyle={styles.wordHanja}
                        />
                      </Text>
                      <Text style={styles.sub}>{w.meaning}</Text>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  overline: { ...T.overline, color: colors.accent, marginBottom: 4 },
  title: { ...T.h1, color: colors.textPrimary, marginBottom: spacing.md },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    gap: 8,
    ...shadows.card,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyText: { ...T.body, color: colors.textSecondary, textAlign: "center" },
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
    ...shadows.card,
  },
  hanja: {
    fontSize: 36,
    fontWeight: "300",
    color: colors.textPrimary,
    width: 48,
    textAlign: "center",
  },
  wordBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.highlight,
    alignItems: "center",
    justifyContent: "center",
  },
  wordHanja: { fontSize: 14, color: colors.textSecondary, fontWeight: "500" },
  meaning: { ...T.bodyLarge, color: colors.textPrimary, fontWeight: "600" },
  sub: { ...T.caption, color: colors.textSecondary, marginTop: 2 },
});
