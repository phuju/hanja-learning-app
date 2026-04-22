import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { colors } from "../lib/theme";

type Props = {
  hanja: string;
  size?: number;
};

/**
 * StrokeOrder renders the given hanja with animated stroke order using
 * HanziWriter (loaded from CDN) inside a WebView.
 */
export default function StrokeOrder({ hanja, size = 260 }: Props) {
  const [loading, setLoading] = React.useState(true);

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>
  html, body {
    margin: 0; padding: 0; height: 100%;
    background: ${colors.background};
    display: flex; align-items: center; justify-content: center;
    -webkit-user-select: none; user-select: none;
    font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif;
  }
  #wrap { display: flex; flex-direction: column; align-items: center; }
  #target {
    width: ${size}px; height: ${size}px;
    background: transparent;
  }
  #btn {
    margin-top: 12px;
    background: ${colors.accent};
    color: #fff;
    border: none;
    padding: 10px 22px;
    border-radius: 9999px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.5px;
    box-shadow: 0 6px 18px rgba(201,122,58,0.25);
  }
  #btn:active { transform: scale(0.97); }
  #fallback {
    font-size: ${Math.floor(size * 0.7)}px;
    color: ${colors.textPrimary};
    font-weight: 300;
    line-height: 1;
  }
</style>
</head>
<body>
<div id="wrap">
  <div id="target"></div>
  <button id="btn">Replay</button>
</div>
<script src="https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js"></script>
<script>
(function(){
  var char = ${JSON.stringify(hanja)};
  var target = document.getElementById('target');
  var btn = document.getElementById('btn');
  function fallback() {
    target.innerHTML = '<div id="fallback">' + char + '</div>';
    btn.style.display = 'none';
  }
  try {
    if (!window.HanziWriter) { fallback(); return; }
    var writer = HanziWriter.create('target', char, {
      width: ${size},
      height: ${size},
      padding: 8,
      strokeColor: '${colors.textPrimary}',
      radicalColor: '${colors.accent}',
      delayBetweenStrokes: 220,
      strokeAnimationSpeed: 1.1,
      showOutline: true,
      outlineColor: '${colors.border}'
    });
    writer.animateCharacter();
    btn.addEventListener('click', function(){
      writer.animateCharacter();
    });
    // If character has no data, HanziWriter fires onLoadCharDataError
    writer._loadingFailed = false;
    var origOnError = HanziWriter.HanziWriter && HanziWriter.HanziWriter.prototype && HanziWriter.HanziWriter.prototype.getCharacterData;
  } catch(e) {
    fallback();
  }
  // Safety timeout: if still empty after 3s, show fallback glyph
  setTimeout(function(){
    if (!target.querySelector('svg')) fallback();
  }, 3500);
})();
</script>
</body>
</html>
`;

  return (
    <View style={[styles.container, { width: size + 32, height: size + 80 }]}>
      {loading && (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        onLoadEnd={() => setLoading(false)}
        backgroundColor={colors.background}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  webview: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.background,
  },
  loader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
});
