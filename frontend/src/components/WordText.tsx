import React from "react";
import { Text, TextProps } from "react-native";

/**
 * WordText renders a Korean/Hanja word, highlighting any characters
 * whose id is in `highlightIds` with the accent color.
 */
export default function WordText({
  text,
  highlightIds,
  baseStyle,
  highlightStyle,
  ...rest
}: {
  text: string;
  highlightIds: string[];
  baseStyle?: TextProps["style"];
  highlightStyle?: TextProps["style"];
} & TextProps) {
  const chars = Array.from(text);
  return (
    <Text {...rest} style={baseStyle}>
      {chars.map((c, i) => (
        <Text
          key={i}
          style={highlightIds.includes(c) ? highlightStyle : undefined}
        >
          {c}
        </Text>
      ))}
    </Text>
  );
}
