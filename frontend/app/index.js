import {
  Text, View, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import charactersData from "../src/data/global_characters.json";
import { parseArray, STREAK_KEY, STUDIED_KEY } from "../src/utils/activity";

const LEVELS = [
  { id: "8급",  chars: 30  },
  { id: "7급",  chars: 20  },
  { id: "6급",  chars: 20  },
  { id: "준5급", chars: 81  },
  { id: "5급",  chars: 150 },
  { id: "준4급", chars: 200 },
  { id: "4급",  chars: 200 },
  { id: "준3급", chars: 300 },
  { id: "3급",  chars: 300 },
];

export default function HomeScreen() {
  const router = useRouter();
  const [saved, setSaved] = useState([]);
  const [streak, setStreak] = useState(0);
  const [totalStudied, setTotalStudied] = useState(0);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    async function load() {
      const data = await AsyncStorage.getItem("savedCharacters");
      if (data) {
        setSaved(JSON.parse(data));
      }
    }
    load();
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const [streakRaw, studiedRaw, savedRaw] = await Promise.all([
        AsyncStorage.getItem(STREAK_KEY),
        AsyncStorage.getItem(STUDIED_KEY),
        AsyncStorage.getItem("savedCharacters"),
      ]);
      setStreak(streakRaw ? parseInt(streakRaw) : 0);
      setTotalStudied(parseArray(studiedRaw).length);
      setSavedCount(parseArray(savedRaw).length);
    } catch {
      // ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f3ee" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>
            <Text style={styles.logoAccent}>漢字</Text> Path
          </Text>
          <Text style={styles.tagline}>Korean Hanja Study</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push("/activity")}
            activeOpacity={0.78}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statNum}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push("/studied")}
            activeOpacity={0.78}
          >
            <Text style={styles.statIcon}>📖</Text>
            <Text style={styles.statNum}>{totalStudied}</Text>
            <Text style={styles.statLabel}>Studied</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push("/saved")}
            activeOpacity={0.78}
          >
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statNum}>{savedCount}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.dailyCard}
          onPress={() => router.push("/daily")}
          activeOpacity={0.78}
        >
          <View style={styles.dailyIconWrap}>
            <Text style={styles.dailyIcon}>日</Text>
          </View>
          <View style={styles.dailyBody}>
            <Text style={styles.dailyTitle}>Daily Path</Text>
            <Text style={styles.dailySubtitle}>Review, learn 5, then quiz</Text>
          </View>
          <Text style={styles.dailyArrow}>→</Text>
        </TouchableOpacity>

        {/* Quick action */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/search")}
            activeOpacity={0.78}
          >
            <Text style={styles.actionIcon}>🔍</Text>
            <Text style={styles.actionText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Section label */}
        <Text style={styles.sectionLabel}>SELECT A LEVEL</Text>

        {/* Level cards */}
        {LEVELS.map((lv) => (
          <View key={lv.id} style={styles.cardRow}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: "/character", params: { level: lv.id } })}
              activeOpacity={0.75}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cardLevel}>{lv.id}</Text>
                <Text style={styles.cardCount}>{lv.chars} characters</Text>
              </View>
              <Text style={styles.cardArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quizBtn}
              onPress={() => router.push({ pathname: "/quiz", params: { level: lv.id } })}
              activeOpacity={0.75}
            >
              <Text style={styles.quizBtnText}>🎯</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f3ee' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },

  header: { alignItems: 'center', paddingVertical: 24 },
  logo: { fontSize: 38, fontWeight: '700', color: '#1a1a1a', letterSpacing: -0.5 },
  logoAccent: { color: '#c97a3a' },
  tagline: { marginTop: 6, fontSize: 14, color: '#999', letterSpacing: 1.5, textTransform: 'uppercase' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16,
    padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statIcon:  { fontSize: 22, marginBottom: 4 },
  statNum:   { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  statLabel: { fontSize: 11, color: '#aaa', marginTop: 2 },

  dailyCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  dailyIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#fef3ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyIcon: {
    fontSize: 26,
    color: '#c97a3a',
    fontWeight: '700',
  },
  dailyBody: { flex: 1 },
  dailyTitle: { color: '#fff', fontSize: 19, fontWeight: '700' },
  dailySubtitle: { color: '#d8d0c8', fontSize: 13, marginTop: 2 },
  dailyArrow: { color: '#f5dfc4', fontSize: 20, fontWeight: '300' },

  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  actionIcon: { fontSize: 18 },
  actionText: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },

  sectionLabel: {
    fontSize: 11, letterSpacing: 2, color: '#aaa', marginBottom: 12, marginLeft: 2,
  },

  cardRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  card: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: 16,
    paddingVertical: 18, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardLeft:  { flex: 1 },
  cardLevel: { fontSize: 20, fontWeight: '600', color: '#1a1a1a' },
  cardCount: { fontSize: 12, color: '#aaa', marginTop: 2 },
  cardArrow: { fontSize: 18, color: '#c97a3a', fontWeight: '300' },

  quizBtn: {
    backgroundColor: '#fef3ea', borderRadius: 16, width: 56,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  quizBtnText: { fontSize: 24 },
});
