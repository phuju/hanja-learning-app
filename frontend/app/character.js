import { WebView } from "react-native-webview";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, Dimensions, Pressable
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import charactersData from "../src/data/global_characters.json";
import wordsData from "../src/data/global_words.json";
import { recordStudiedCharacter } from "../src/utils/activity";

const SCREEN_W = Dimensions.get("window").width;
const WRITER_SIZE = Math.min(SCREEN_W - 80, 280);

export default function CharacterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const level = params.level;
  const hanjaParam = params.hanja;
  const listTitle = params.listTitle;

  const customList = useMemo(() => {
    if (!params.customList) return null;
    try { return JSON.parse(params.customList); } catch { return null; }
  }, [params.customList]);

  const characters = useMemo(() => {
    if (customList) {
      return customList
        .map(item => charactersData.characters.find(c => c.hanja === item))
        .filter(Boolean);
    }
    if (!level) return [];
    return charactersData.characters.filter(c =>
      c.levels.some(l => l.normalize("NFC") === level.normalize("NFC"))
    );
  }, [customList, level]);

  const startIndex = hanjaParam ? characters.findIndex(c => c.hanja === hanjaParam) : 0;
  const [index, setIndex] = useState(startIndex >= 0 ? startIndex : 0);
  const [savedCharacters, setSavedCharacters] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem("savedCharacters").then(stored => {
      if (stored) setSavedCharacters(JSON.parse(stored));
    });
  }, []);

  const character = characters[index];

  useEffect(() => {
    if (character?.hanja) recordStudiedCharacter(character.hanja);
  }, [character?.hanja]);

  if (!character) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#f7f3ee" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#999" }}>No characters to study</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isSaved = savedCharacters.includes(character.hanja);
  const isFirst = index === 0;
  const isLast = index === characters.length - 1;
  const relatedWords = wordsData.words.filter(w =>
    w.hanja_array.includes(character.hanja)
  );

  function next() {
    if (characters.length === 0) return;
    setIndex(i => i < characters.length - 1 ? i + 1 : 0);
    setSelectedWord(null);
  }
  function prev() {
    if (characters.length === 0) return;
    setIndex(i => i > 0 ? i - 1 : characters.length - 1);
    setSelectedWord(null);
  }

  async function toggleSave() {
    const updated = isSaved
      ? savedCharacters.filter(c => c !== character.hanja)
      : [...savedCharacters, character.hanja];
    setSavedCharacters(updated);
    await AsyncStorage.setItem("savedCharacters", JSON.stringify(updated));
  }

  const swipe = Gesture.Pan().runOnJS(true)
    .activeOffsetX([-20, 20]).failOffsetY([-20, 20])
    .onEnd((e) => {
      if (e.translationX < -60) next();
      if (e.translationX > 60) prev();
    });

  // Polished HanziWriter: rice-grid (米字格) bg, brush-style animation,
  // accent color for radical, soft shadows, interactive replay.
  const hanziHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<script src="https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js"></script>
<style>
  html, body {
    margin:0; padding:0; width:100%; height:100%;
    background:transparent; overflow:hidden;
    -webkit-user-select:none; user-select:none;
    display:flex; align-items:center; justify-content:center;
  }
  #frame {
    position:relative;
    width:${WRITER_SIZE}px; height:${WRITER_SIZE}px;
    background:#fffdfa;
    border-radius:22px;
    overflow:hidden;
  }
  /* subtle paper vignette */
  #frame::after {
    content:""; position:absolute; inset:0;
    background:radial-gradient(120% 120% at 50% 50%, transparent 55%, rgba(201,122,58,0.04) 100%);
    pointer-events:none;
  }
  /* 米字格 rice-grid guide */
  #grid {
    position:absolute; inset:14px;
    border:1px dashed #ecdfca; border-radius:14px;
  }
  #cross-v, #cross-h, #diag-1, #diag-2 {
    position:absolute; pointer-events:none;
  }
  #cross-v { left:50%; top:14px; bottom:14px; width:1px; background:#f1e3cc; transform:translateX(-0.5px); }
  #cross-h { top:50%; left:14px; right:14px; height:1px; background:#f1e3cc; transform:translateY(-0.5px); }
  #diag-1, #diag-2 {
    top:14px; bottom:14px; left:14px; right:14px;
    background:linear-gradient(to bottom right, transparent calc(50% - 0.5px), #f7ead4 50%, transparent calc(50% + 0.5px));
    opacity:0.7;
  }
  #diag-2 { background:linear-gradient(to top right, transparent calc(50% - 0.5px), #f7ead4 50%, transparent calc(50% + 0.5px)); }
  #target {
    position:absolute; left:50%; top:50%;
    transform:translate(-50%, -50%);
    z-index:3;
  }
  #replay {
    position:absolute; bottom:10px; left:50%;
    transform:translateX(-50%);
    z-index:4; font-size:11px; color:#b5957a;
    letter-spacing:1.6px; text-transform:uppercase;
    font-family:-apple-system,BlinkMacSystemFont,sans-serif;
    opacity:0; transition:opacity 0.3s;
  }
  #replay.show { opacity:1; }
  #tap-surface {
    position:absolute; inset:0; z-index:5;
    cursor:pointer;
  }
</style>
</head>
<body>
<div id="frame">
  <div id="grid"></div>
  <div id="cross-v"></div>
  <div id="cross-h"></div>
  <div id="diag-1"></div>
  <div id="diag-2"></div>
  <div id="target"></div>
  <div id="replay">tap to replay ↻</div>
  <div id="tap-surface"></div>
</div>
<script>
(function(){
  const char = ${JSON.stringify(character.hanja)};
  const replay = document.getElementById('replay');
  const surface = document.getElementById('tap-surface');
  let writer;
  try {
    writer = HanziWriter.create('target', char, {
      width:${WRITER_SIZE - 28},
      height:${WRITER_SIZE - 28},
      padding:6,
      strokeColor:'#1a1a1a',
      radicalColor:'#c97a3a',
      outlineColor:'#e8dcc9',
      strokeFadeDuration:400,
      strokeAnimationSpeed:0.9,
      delayBetweenStrokes:220,
      showOutline:true,
      showCharacter:false
    });
    function play() {
      replay.classList.remove('show');
      writer.animateCharacter({
        onComplete:function(){
          setTimeout(function(){ replay.classList.add('show'); }, 400);
        }
      });
    }
    surface.addEventListener('click', play);
    setTimeout(play, 120);
  } catch(e) {
    // fallback: show static glyph
    const t = document.getElementById('target');
    t.style.font = '300 ${WRITER_SIZE * 0.7}px -apple-system, "Apple SD Gothic Neo", sans-serif';
    t.style.color = '#1a1a1a';
    t.innerText = char;
  }
})();
</script>
</body>
</html>`;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f3ee" />
      <GestureDetector gesture={swipe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <Text style={styles.levelBadge}>
              {customList ? (listTitle || "Review") : level}
            </Text>
            <Text style={styles.counter}>{index + 1} / {characters.length}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((index + 1) / characters.length) * 100}%` }]} />
          </View>

          {/* Main character card */}
          <View style={styles.card}>
            {/* 음 reading pill top-right */}
            <View style={styles.pillEum}>
              <Text style={styles.pillEumLabel}>음</Text>
              <Text style={styles.pillEumValue}>{character["음"]}</Text>
            </View>

            {/* Writer panel */}
            <View style={styles.writerWrap}>
              <WebView
                key={character.hanja}
                style={styles.writer}
                originWhitelist={["*"]}
                source={{ html: hanziHTML }}
                scrollEnabled={false}
                backgroundColor="transparent"
                androidLayerType="hardware"
              />
            </View>

            {/* Practice button - redesigned */}
            <TouchableOpacity
              style={styles.practiceBtn}
              onPress={() => router.push({ pathname: "/practice", params: { hanja: character.hanja } })}
              activeOpacity={0.82}
            >
              <Text style={styles.practiceBtnIcon}>✍</Text>
              <Text style={styles.practiceBtnText}>Practice writing</Text>
            </TouchableOpacity>

            {/* Meaning section */}
            <View style={styles.meaningBlock}>
              <Text style={styles.english}>{character.english || "—"}</Text>
              <View style={styles.hunRow}>
                <Text style={styles.hunLabel}>훈</Text>
                <Text style={styles.hunValue}>{character["훈"]}</Text>
              </View>
            </View>

            {/* Radical + strokes + save — redesigned as a single toolbar */}
            <View style={styles.toolbar}>
              <TouchableOpacity
                style={styles.toolItem}
                onPress={() => {
                  const filtered = charactersData.characters
                    .filter(c => c.radical === character.radical)
                    .map(c => c.hanja);
                  router.push({
                    pathname: "/character",
                    params: {
                      customList: JSON.stringify(filtered),
                      listTitle: `부수: ${character.radical}`,
                    }
                  });
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.toolLabel}>RADICAL</Text>
                <View style={styles.toolRow}>
                  <Text style={styles.toolHanja}>{character.radical}</Text>
                  <Text style={styles.toolMini}>{character.radical_meaning}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.toolDivider} />

              <View style={styles.toolItem}>
                <Text style={styles.toolLabel}>STROKES</Text>
                <View style={styles.toolRow}>
                  <Text style={styles.toolHanja}>{character.strokes}</Text>
                </View>
              </View>

              <View style={styles.toolDivider} />

              <Pressable
                style={[styles.saveItem, isSaved && styles.saveItemActive]}
                onPress={toggleSave}
              >
                <Text style={[styles.saveIcon, isSaved && styles.saveIconActive]}>
                  {isSaved ? "★" : "☆"}
                </Text>
                <Text style={[styles.saveLabel, isSaved && styles.saveLabelActive]}>
                  {isSaved ? "Saved" : "Save"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Related words */}
          {relatedWords.length > 0 && (
            <View style={styles.wordsSection}>
              <Text style={styles.sectionLabel}>RELATED WORDS · {relatedWords.length}</Text>
              <View style={styles.wordsGrid}>
                {relatedWords.map(w => (
                  <TouchableOpacity
                    key={w.hanja}
                    style={[
                      styles.wordChip,
                      selectedWord?.hanja === w.hanja && styles.wordChipActive,
                    ]}
                    onPress={() =>
                      setSelectedWord(selectedWord?.hanja === w.hanja ? null : w)
                    }
                    activeOpacity={0.78}
                  >
                    <Text style={styles.wordChipText}>{w.word}</Text>
                    <Text style={styles.wordChipHanja}>
                      {renderHighlightedHanja(w.hanja, character.hanja)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedWord && (
                <View style={styles.wordDetail}>
                  <View style={styles.wordDetailHeader}>
                    <Text style={styles.wordDetailWord}>{selectedWord.word}</Text>
                    <Text style={styles.wordDetailHanja}>
                      {renderHighlightedHanja(selectedWord.hanja, character.hanja, styles.wordDetailHanjaBig)}
                    </Text>
                  </View>
                  <Text style={styles.wordDetailMeaning}>{selectedWord.meaning}</Text>
                  {selectedWord.english ? (
                    <Text style={styles.wordDetailEnglish}>{selectedWord.english}</Text>
                  ) : null}
                </View>
              )}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </GestureDetector>

      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navBtn, isFirst && styles.navBtnLoop]}
          onPress={prev}
          activeOpacity={0.8}
        >
          <Text style={styles.navBtnText}>{isFirst ? "↻ End" : "← Prev"}</Text>
        </TouchableOpacity>
        <Text style={styles.navCounter}>{index + 1} / {characters.length}</Text>
        <TouchableOpacity
          style={[styles.navBtn, isLast && styles.navBtnLoop]}
          onPress={next}
          activeOpacity={0.8}
        >
          <Text style={styles.navBtnText}>{isLast ? "↻ Start" : "Next →"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function renderHighlightedHanja(hanjaString, target, style) {
  const chars = Array.from(hanjaString);
  return (
    <>
      {chars.map((c, i) => (
        <Text
          key={i}
          style={[style, c === target ? styles.hanjaHighlight : null]}
        >
          {c}
        </Text>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f3ee" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 },

  topRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 10,
  },
  levelBadge: {
    fontSize: 12, fontWeight: "700", color: "#c97a3a",
    backgroundColor: "#fef3ea", paddingHorizontal: 12,
    paddingVertical: 5, borderRadius: 20, overflow: "hidden",
    letterSpacing: 0.3,
  },
  counter: { fontSize: 13, color: "#aaa", fontWeight: "600" },

  progressTrack: {
    height: 3, backgroundColor: "#e4dfd8",
    borderRadius: 2, marginBottom: 18, overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#c97a3a", borderRadius: 2 },

  card: {
    backgroundColor: "#ffffff", borderRadius: 28,
    paddingVertical: 28, paddingHorizontal: 22, alignItems: "center",
    shadowColor: "#2D2824", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
    marginBottom: 20, position: "relative",
  },
  pillEum: {
    position: "absolute", top: 18, right: 18,
    backgroundColor: "#1a1a1a", borderRadius: 100,
    paddingHorizontal: 14, paddingVertical: 7,
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  pillEumLabel: {
    color: "#f5dfc4", fontSize: 10, fontWeight: "700",
    letterSpacing: 1.2,
  },
  pillEumValue: {
    color: "#fff", fontSize: 16, fontWeight: "700",
  },

  writerWrap: {
    width: WRITER_SIZE + 8, height: WRITER_SIZE + 8,
    alignItems: "center", justifyContent: "center",
    marginTop: 8, marginBottom: 18,
    backgroundColor: "#fffdfa",
    borderRadius: 24,
    shadowColor: "#c97a3a", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 3,
  },
  writer: { width: WRITER_SIZE, height: WRITER_SIZE, backgroundColor: "transparent" },

  practiceBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingVertical: 11, paddingHorizontal: 22,
    borderRadius: 100, gap: 10, marginBottom: 22,
  },
  practiceBtnIcon: { fontSize: 14, color: "#c97a3a" },
  practiceBtnText: { color: "#fff", fontSize: 14, fontWeight: "700", letterSpacing: 0.2 },

  meaningBlock: { alignItems: "center", marginBottom: 22, gap: 6 },
  english: {
    fontSize: 28, fontWeight: "700", color: "#c97a3a",
    textAlign: "center", lineHeight: 34,
  },
  hunRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  hunLabel: {
    fontSize: 10, letterSpacing: 1.6, color: "#bbb",
    fontWeight: "700",
  },
  hunValue: { fontSize: 17, fontWeight: "500", color: "#555" },

  toolbar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#faf6f0", borderRadius: 18,
    paddingVertical: 14, paddingHorizontal: 10,
    alignSelf: "stretch",
  },
  toolItem: { flex: 1, alignItems: "center", paddingVertical: 4 },
  toolLabel: {
    fontSize: 9, letterSpacing: 1.8, color: "#b5a692",
    fontWeight: "800", marginBottom: 6,
  },
  toolRow: { alignItems: "center" },
  toolHanja: { fontSize: 22, fontWeight: "700", color: "#1a1a1a", lineHeight: 26 },
  toolMini: { fontSize: 10, color: "#999", marginTop: 2, textAlign: "center" },
  toolDivider: { width: 1, height: 40, backgroundColor: "#eadfcd" },

  saveItem: {
    flex: 1, alignItems: "center",
    paddingVertical: 4,
  },
  saveItemActive: {},
  saveIcon: { fontSize: 22, color: "#cfc3af", marginTop: 2 },
  saveIconActive: { color: "#c97a3a" },
  saveLabel: {
    fontSize: 10, letterSpacing: 1.2, color: "#b5a692",
    fontWeight: "700", marginTop: 2,
  },
  saveLabelActive: { color: "#c97a3a" },

  wordsSection: { marginTop: 4 },
  sectionLabel: { fontSize: 10, letterSpacing: 2, color: "#aaa", marginBottom: 12, fontWeight: "700" },
  wordsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  wordChip: {
    backgroundColor: "#ffffff", borderWidth: 1.5,
    borderColor: "#ece4d6", borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 16,
    alignItems: "center", minWidth: 80,
  },
  wordChipActive: { borderColor: "#c97a3a", backgroundColor: "#fef3ea" },
  wordChipText: { fontSize: 17, fontWeight: "600", color: "#1a1a1a" },
  wordChipHanja: { fontSize: 12, color: "#999", marginTop: 4 },
  hanjaHighlight: { color: "#c97a3a", fontWeight: "800" },

  wordDetail: {
    backgroundColor: "#ffffff", borderRadius: 16,
    borderWidth: 1.5, borderColor: "#f5dfc4",
    padding: 18, marginTop: 12,
  },
  wordDetailHeader: {
    flexDirection: "row", alignItems: "baseline",
    gap: 12, marginBottom: 8,
  },
  wordDetailWord: { fontSize: 26, fontWeight: "700", color: "#1a1a1a" },
  wordDetailHanja: { fontSize: 16, color: "#999", fontWeight: "500" },
  wordDetailHanjaBig: { fontSize: 16, color: "#999" },
  wordDetailMeaning: { fontSize: 14, color: "#666", lineHeight: 20, marginBottom: 4 },
  wordDetailEnglish: { fontSize: 18, fontWeight: "600", color: "#c97a3a", marginTop: 4 },

  navBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#ffffff", borderTopWidth: 1, borderTopColor: "#eadfcd",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 22,
  },
  navBtn: {
    backgroundColor: "#c97a3a", paddingVertical: 12,
    paddingHorizontal: 26, borderRadius: 100,
  },
  navBtnLoop: { backgroundColor: "#1a1a1a", paddingHorizontal: 22 },
  navBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "700", letterSpacing: 0.2 },
  navCounter: { fontSize: 13, color: "#aaa", fontWeight: "600" },
});
