import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { VIP_DIAMOND, VIP_GOLD, VIP_SILVER } from "@/constants/colors";

interface Props {
  level: 0 | 1 | 2 | 3;
  size?: "sm" | "md";
}

const VIP_CONFIG = {
  0: null,
  1: { label: "VIP", color: VIP_SILVER, icon: "star-outline" as const },
  2: { label: "VIP+", color: VIP_GOLD, icon: "star" as const },
  3: { label: "VIP★", color: VIP_DIAMOND, icon: "diamond" as const },
};

export default function VIPBadge({ level, size = "sm" }: Props) {
  const config = VIP_CONFIG[level];
  if (!config) return null;

  const isSmall = size === "sm";
  return (
    <View style={[styles.badge, { backgroundColor: config.color + "22", borderColor: config.color }]}>
      <Ionicons name={config.icon} size={isSmall ? 8 : 10} color={config.color} />
      <Text style={[styles.label, { color: config.color, fontSize: isSmall ? 9 : 11 }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    gap: 2,
  },
  label: {
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
