import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  uri?: string | null;
  name?: string;
  size?: number;
  online?: boolean;
}

export default function Avatar({ uri, name, size = 40, online }: Props) {
  const colors = useColors();
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.primary + "33",
              borderColor: colors.primary + "55",
            },
          ]}
        >
          <Text style={[styles.initials, { color: colors.primary, fontSize: size * 0.35 }]}>
            {initials}
          </Text>
        </View>
      )}
      {online && (
        <View
          style={[
            styles.onlineDot,
            {
              backgroundColor: colors.online,
              width: size * 0.25,
              height: size * 0.25,
              borderRadius: size * 0.125,
              right: 0,
              bottom: 0,
              borderColor: colors.background,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { resizeMode: "cover" },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  initials: { fontWeight: "700" },
  onlineDot: {
    position: "absolute",
    borderWidth: 2,
  },
});
