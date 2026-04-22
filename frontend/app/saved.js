import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import charactersData from "../src/data/global_characters.json";

const ALL_CHARS = charactersData.characters;

export default function SavedScreen() {
  const router = useRouter();
  const [savedHanja, setSavedHanja] = useState([]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("savedCharacters").then(stored => {
        setSavedHanja(stored ? JSON.parse(stored) : []);
      });
    }, [])
  );

  async function remove(hanja) {
    const updated = savedHanja.filter(h => h !== hanja);
    setSavedHanja(updated);
    await AsyncStorage.setItem("savedCharacters", JSON.stringify(updated));
  }

  const characters = ALL_CHARS.filter(c => savedHanja.includes(c.hanja));

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f3ee" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>Saved Characters</Text>
        <Text style={styles.subtitle}>{characters.length} character{characters.length !== 1 ? "s" : ""} bookmarked</Text>

        {characters.length > 0 && (
          <TouchableOpacity
            style={styles.reviewBtn}
            onPress={() =>
              router.push({
                pathname: "/character",
                params: { customList: JSON.stringify(savedHanja), listTitle: "Saved" }
              })
            }
          >
            <Text style={styles.reviewBtnText}>▶ Start Review</Text>
          </TouchableOpacity>
        )}

        {characters.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>☆</Text>
            <Text style={styles.emptyText}>No saved characters yet</Text>
            <Text style={styles.emptyHint}>Tap ☆ on any character to save it here</Text>
          </View>
        ) : (
          characters.map(char => (
            <View key={char.hanja} style={styles.row}>
              <TouchableOpacity
                style={styles.rowMain}
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
              <TouchableOpacity style={styles.removeBtn} onPress={() => remove(char.hanja)}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
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
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 16, marginBottom: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    overflow: "hidden",
  },
  rowMain: { flex: 1, flexDirection: "row", alignItems: "center", padding: 16 },
  hanja: { fontSize: 40, color: "#1a1a1a", marginRight: 16, width: 52 },
  info: { flex: 1 },
  reading: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  english: { fontSize: 14, color: "#c97a3a", marginTop: 2 },
  level: {
    fontSize: 11, color: "#c97a3a", backgroundColor: "#fef3ea",
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
    alignSelf: "flex-start", marginTop: 4, overflow: "hidden",
  },
  removeBtn: {
    paddingHorizontal: 16, paddingVertical: 20,
    borderLeftWidth: 1, borderLeftColor: "#f0ece6",
  },
  removeBtnText: { fontSize: 14, color: "#ccc" },

  reviewBtn: {
    backgroundColor: "#c97a3a",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  reviewBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
