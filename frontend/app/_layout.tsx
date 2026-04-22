import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#f7f3ee" },
            headerShadowVisible: false,
            headerTintColor: "#1a1a1a",
            headerTitleStyle: { fontWeight: "700" },
            contentStyle: { backgroundColor: "#f7f3ee" },
          }}
        >
          <Stack.Screen name="index" options={{ title: "HanjaPath" }} />
          <Stack.Screen name="activity" options={{ title: "Activity" }} />
          <Stack.Screen name="character" options={{ title: "Study" }} />
          <Stack.Screen name="saved" options={{ title: "Saved" }} />
          <Stack.Screen name="studied" options={{ title: "Studied" }} />
          <Stack.Screen name="quiz" options={{ title: "Quiz", headerShown: false }} />
          <Stack.Screen name="search" options={{ title: "Search" }} />
          <Stack.Screen name="daily" options={{ title: "Daily Path" }} />
          <Stack.Screen name="practice" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
