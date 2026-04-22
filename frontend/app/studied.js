import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import charactersData from "../src/data/global_characters.json";
import { parseArray, STUDIED_KEY } from "../src/utils/activity";

const ALL_CHARS = charactersData.characters;

export default function StudiedScreen() {
  const router = useRouter();
  const [studiedHanja, setStudiedHanja] = useState([]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(STUDIED_KEY).then(stored => {
        setStudiedHanja(parseArray(stored));
      });
    }, [])
  );

  const characters = studiedHanja
    .map(hanja => ALL_CHARS.find(c => c.hanja === hanja))
    .filter(Boolean);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f3ee" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>Studied Characters</Text>
        <Text style={styles.subtitle}>
          {characters.length} character{characters.length !== 1 ? "s" : ""} viewed
        </Text>

        {characters.length > 0 && (
          <TouchableOpacity
            style={styles.reviewBtn}
            onPress={() =>
              router.push({
                pathname: "/character",
                params: { customList: JSON.stringify(studiedHanja), listTitle: "Studied" }
              })
            }
            activeOpacity={0.78}
          >
            <Text style={styles.reviewBtnText}>▶ Review Studied</Text>
          </TouchableOpacity>
        )}

        {characters.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>漢</Text>
            <Text style={styles.emptyText}>No studied characters yet</Text>
            <Text style={styles.emptyHint}>Open any level and view characters to build this list</Text>
          </View>
        ) : (
          characters.map(char => (
            <TouchableOpacity
              key={char.hanja}
              style={styles.row}
              onPress={() => router.push({
                pathname: "/character",
                params: {
                  level: char.levels?.[0] || "8급",
                  hanja: char.hanja,
                }
              })}
              activeOpacity={0.75}
            >
              <Text style={styles.hanja}>{char.hanja}</Text>
              <View style={styles.info}>
                <Text style={styles.reading}>{char["훈"]} · {char["음"]}</Text>
                <Text style={styles.english}>{char.english || ""}</Text>
                <Text style={styles.level}>{char.levels?.[0]}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f3ee" },
  content: { paddingHorizontal: 20, paddingTop: 20 },

  title: { fontSize: 28, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#aaa", marginBottom: 20 },

  empty: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 56, color: "#ddd", marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#aaa" },
  emptyHint: { fontSize: 13, color: "#ccc", marginTop: 8, textAlign: "center" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  hanja: { fontSize: 40, color: "#1a1a1a", marginRight: 16, width: 52 },
  info: { flex: 1 },
  reading: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  english: { fontSize: 14, color: "#c97a3a", marginTop: 2 },
  level: {
    fontSize: 11,
    color: "#c97a3a",
    backgroundColor: "#fef3ea",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 4,
    overflow: "hidden",
  },

  reviewBtn: {
    backgroundColor: "#c97a3a",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  reviewBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
