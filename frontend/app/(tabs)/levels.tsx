import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
  LEVELS,
} from "../../src/lib/theme";
import { countByLevel } from "../../src/lib/data";

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  "8급": "Foundation · numbers, nature, family",
  "7급": "Everyday · home, body, time",
  "6급": "Common · feelings, society",
  "5급": "Practical · commerce, ideas",
  "4급": "Advanced · history, culture",
  "3급": "High · nuance, abstract",
};

export default function LevelsScreen() {
  const router = useRouter();
  const counts = countByLevel();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="levels-screen">
      <View style={styles.header}>
        <Text style={styles.overline}>LEVELS</Text>
        <Text style={styles.title}>Browse by 급수</Text>
        <Text style={styles.sub}>
          Tap a level to swipe through its characters.
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {LEVELS.map((lv, idx) => (
          <TouchableOpacity
            key={lv}
            style={styles.row}
            activeOpacity={0.85}
            onPress={() => router.push(`/browse/${encodeURIComponent(lv)}`)}
            testID={`level-row-${lv}`}
          >
            <View style={styles.rank}>
              <Text style={styles.rankNum}>{idx + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{lv}</Text>
              <Text style={styles.rowSub}>{LEVEL_DESCRIPTIONS[lv]}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.count}>{counts[lv] || 0}</Text>
              <Feather name="chevron-right" size={22} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.md },
  overline: { ...T.overline, color: colors.accent, marginBottom: 4 },
  title: { ...T.h1, color: colors.textPrimary },
  sub: { ...T.body, color: colors.textSecondary, marginTop: 6 },
  list: { padding: spacing.lg, paddingTop: 0, gap: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
    ...shadows.card,
  },
  rank: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.highlight,
    alignItems: "center",
    justifyContent: "center",
  },
  rankNum: { ...T.h3, color: colors.accent },
  rowTitle: { ...T.h3, color: colors.textPrimary },
  rowSub: { ...T.caption, color: colors.textSecondary, marginTop: 2 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  count: { ...T.caption, color: colors.textMuted, fontWeight: "600" },
});
