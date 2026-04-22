import { WebView } from "react-native-webview";
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

const SCREEN_W = Dimensions.get("window").width;
const CARD_SIZE = Math.min(SCREEN_W - 80, 320);

export default function PracticeScreen() {
  const router = useRouter();
  const { hanja } = useLocalSearchParams();
  const webviewRef = useRef(null);

  const html = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<script src="https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js"></script>
<style>
  html, body {
    margin:0; padding:0; width:100%; height:100%;
    background:#f7f3ee; overflow:hidden;
    display:flex; justify-content:center; align-items:center;
    -webkit-user-select:none; user-select:none;
    font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Apple SD Gothic Neo",sans-serif;
  }
  #frame {
    position:relative;
    width:${CARD_SIZE}px; height:${CARD_SIZE}px;
    background:#ffffff;
    border-radius:24px;
    box-shadow:0 6px 24px rgba(0,0,0,0.06);
    display:flex; align-items:center; justify-content:center;
  }
  #grid {
    position:absolute; inset:18px;
    border:1px dashed #e8dcc9; border-radius:16px;
  }
  #grid::before, #grid::after {
    content:""; position:absolute;
    background:#f0e0c9;
  }
  #grid::before { left:50%; top:10%; bottom:10%; width:1px; transform:translateX(-0.5px); }
  #grid::after  { top:50%; left:10%; right:10%; height:1px; transform:translateY(-0.5px); }
  #target { position:relative; z-index:2; }
  #done {
    display:none; position:absolute; inset:0;
    background:rgba(247,243,238,0.97); border-radius:24px;
    justify-content:center; align-items:center; flex-direction:column; z-index:5;
  }
  #done.show { display:flex; }
  #doneEmoji { font-size:44px; }
  #doneText { font-size:18px; font-weight:700; color:#1a1a1a; margin-top:8px; }
  #doneSub  { font-size:12px; color:#999; margin-top:4px; letter-spacing:0.6px; text-transform:uppercase; }
</style>
</head>
<body>
<div id="frame">
  <div id="grid"></div>
  <div id="target"></div>
  <div id="done">
    <div id="doneEmoji">✨</div>
    <div id="doneText">Well done</div>
    <div id="doneSub">tap ↻ to try again</div>
  </div>
</div>
<script>
  const writer = HanziWriter.create('target', ${JSON.stringify(hanja ?? "")}, {
    width:${CARD_SIZE - 36}, height:${CARD_SIZE - 36}, padding:10,
    strokeColor:'#1a1a1a',
    outlineColor:'#e8dcc9',
    highlightColor:'#c97a3a',
    drawingColor:'#c97a3a',
    strokeAnimationSpeed:0.8,
    delayBetweenStrokes:140,
    showOutline:true,
    showCharacter:false,
  });
  const doneEl = document.getElementById('done');
  function startQuiz() {
    doneEl.classList.remove('show');
    writer.quiz({
      showHintAfterMisses:1,
      highlightOnComplete:true,
      onComplete:function(){ doneEl.classList.add('show'); }
    });
  }
  window.replay = function(){ startQuiz(); };
  window.showHint = function(){
    writer.animateStroke && writer.animateStroke(0);
  };
  startQuiz();
</script>
</body>
</html>`;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Practice Writing</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => webviewRef.current?.injectJavaScript("window.showHint(); true;")}
          >
            <Text style={styles.replay}>💡</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => webviewRef.current?.injectJavaScript("window.replay(); true;")}
          >
            <Text style={styles.replay}>↻</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.center}>
        <WebView
          ref={webviewRef}
          originWhitelist={["*"]}
          source={{ html }}
          style={{ width: CARD_SIZE + 20, height: CARD_SIZE + 20, backgroundColor: "transparent" }}
          scrollEnabled={false}
        />
        <Text style={styles.hint}>Trace each stroke in order</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f3ee" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  iconBtn: {
    width: 40, height: 40, alignItems: "center", justifyContent: "center",
    borderRadius: 20,
  },
  close: { fontSize: 20, color: "#1a1a1a" },
  replay: { fontSize: 18, color: "#c97a3a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 18 },
  hint: {
    fontSize: 12, color: "#aaa", letterSpacing: 1.2, textTransform: "uppercase",
  },
});
