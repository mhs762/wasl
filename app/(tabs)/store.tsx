import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { VIP_DIAMOND, VIP_GOLD, VIP_SILVER } from "@/constants/colors";

type Tab = "vip" | "coins" | "gifts";

interface VIPPlan {
  id: string;
  name: string;
  duration: string;
  price: string;
  points: number;
  color: string;
  perks: string[];
}

interface CoinPack {
  id: string;
  coins: number;
  price: string;
  bonus?: string;
  popular?: boolean;
}

interface Gift {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  color: string;
}

const VIP_PLANS: VIPPlan[] = [
  { id: "silver", name: "VIP فضي", duration: "شهر", price: "9.99$", points: 500, color: VIP_SILVER, perks: ["شارة فضية", "إخفاء الزيارات", "تحديث أولوي"] },
  { id: "gold", name: "VIP ذهبي", duration: "شهر", price: "19.99$", points: 1000, color: VIP_GOLD, perks: ["شارة ذهبية", "مكالمات غير محدودة", "هدايا مجانية", "ظهور أعلى في البحث"] },
  { id: "diamond", name: "VIP ألماسي", duration: "شهر", price: "39.99$", points: 2000, color: VIP_DIAMOND, perks: ["شارة ألماسية", "جميع مزايا الذهبي", "غرفة صوتية مخصصة", "دعم مميز على مدار الساعة"] },
];

const COIN_PACKS: CoinPack[] = [
  { id: "c1", coins: 100, price: "0.99$" },
  { id: "c2", coins: 500, price: "3.99$", bonus: "+50 مجانية" },
  { id: "c3", coins: 1000, price: "6.99$", bonus: "+200 مجانية", popular: true },
  { id: "c4", coins: 5000, price: "29.99$", bonus: "+1000 مجانية" },
];

const GIFTS: Gift[] = [
  { id: "g1", name: "وردة", emoji: "🌹", cost: 10, color: "#EF4444" },
  { id: "g2", name: "قلب", emoji: "💝", cost: 20, color: "#EC4899" },
  { id: "g3", name: "تاج", emoji: "👑", cost: 100, color: VIP_GOLD },
  { id: "g4", name: "نجمة", emoji: "⭐", cost: 50, color: "#F59E0B" },
  { id: "g5", name: "صاروخ", emoji: "🚀", cost: 200, color: "#8B5CF6" },
  { id: "g6", name: "جوهرة", emoji: "💎", cost: 500, color: VIP_DIAMOND },
  { id: "g7", name: "كعكة", emoji: "🎂", cost: 30, color: "#F97316" },
  { id: "g8", name: "سيارة", emoji: "🚗", cost: 1000, color: "#10B981" },
];

export default function StoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const isWeb = Platform.OS === "web";
  const [activeTab, setActiveTab] = useState<Tab>("vip");

  const topPad = isWeb ? 67 : insets.top;

  const handleBuy = (item: string, price: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "تأكيد الشراء",
      `شراء "${item}" بسعر ${price}؟`,
      [
        { text: "إلغاء", style: "cancel" },
        { text: "شراء", onPress: () => Alert.alert("✅ تم الشراء", "شكراً لاشتراكك في وصل!") },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>المتجر</Text>
        <View style={[styles.coinBadge, { backgroundColor: colors.gold + "22", borderColor: colors.gold }]}>
          <Ionicons name="star" size={14} color={colors.gold} />
          <Text style={[styles.coinCount, { color: colors.gold }]}>{profile?.points ?? 0}</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {(["vip", "coins", "gifts"] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabBtn,
              { borderBottomColor: activeTab === tab ? colors.primary : "transparent", borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>
              {tab === "vip" ? "VIP" : tab === "coins" ? "نقاط" : "هدايا"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "vip" && (
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: isWeb ? 34 : 100 }]}>
          {VIP_PLANS.map((plan) => (
            <View key={plan.id} style={[styles.vipCard, { borderColor: plan.color, backgroundColor: plan.color + "11" }]}>
              <View style={styles.vipTop}>
                <View style={[styles.vipBadge, { backgroundColor: plan.color }]}>
                  <Text style={styles.vipBadgeText}>{plan.name}</Text>
                </View>
                <View style={styles.vipPriceCol}>
                  <Text style={[styles.vipPrice, { color: plan.color }]}>{plan.price}</Text>
                  <Text style={[styles.vipDuration, { color: colors.mutedForeground }]}>/{plan.duration}</Text>
                </View>
              </View>
              <View style={styles.perksCol}>
                {plan.perks.map((perk) => (
                  <View key={perk} style={styles.perkRow}>
                    <Ionicons name="checkmark-circle" size={16} color={plan.color} />
                    <Text style={[styles.perkText, { color: colors.text }]}>{perk}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.buyBtn, { backgroundColor: plan.color }]}
                onPress={() => handleBuy(plan.name, plan.price)}
              >
                <Text style={styles.buyBtnText}>اشترك الآن</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {activeTab === "coins" && (
        <FlatList
          data={COIN_PACKS}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.coinsRow}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: isWeb ? 34 : 100 }]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.coinCard, { backgroundColor: colors.card, borderColor: item.popular ? colors.primary : colors.border }]}
              onPress={() => handleBuy(`${item.coins} نقطة`, item.price)}
            >
              {item.popular && (
                <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.popularText}>الأكثر طلباً</Text>
                </View>
              )}
              <Ionicons name="star" size={32} color={colors.gold} />
              <Text style={[styles.coinAmount, { color: colors.text }]}>{item.coins}</Text>
              {item.bonus && (
                <Text style={[styles.bonusText, { color: colors.primary }]}>{item.bonus}</Text>
              )}
              <Text style={[styles.coinPrice, { color: colors.primary }]}>{item.price}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {activeTab === "gifts" && (
        <FlatList
          data={GIFTS}
          keyExtractor={(item) => item.id}
          numColumns={4}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: isWeb ? 34 : 100 }]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.giftCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleBuy(item.name, `${item.cost} نقطة`)}
            >
              <Text style={styles.giftEmoji}>{item.emoji}</Text>
              <Text style={[styles.giftName, { color: colors.text }]}>{item.name}</Text>
              <View style={styles.giftCostRow}>
                <Ionicons name="star" size={10} color={colors.gold} />
                <Text style={[styles.giftCost, { color: colors.gold }]}>{item.cost}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 24, fontWeight: "800" },
  coinBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  coinCount: { fontSize: 14, fontWeight: "700" },
  tabs: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { fontSize: 15, fontWeight: "700" },
  scrollContent: { padding: 14, gap: 14 },
  vipCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 14, marginBottom: 14 },
  vipTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  vipBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  vipBadgeText: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  vipPriceCol: { alignItems: "flex-end" },
  vipPrice: { fontSize: 22, fontWeight: "900" },
  vipDuration: { fontSize: 12 },
  perksCol: { gap: 8 },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  perkText: { fontSize: 14 },
  buyBtn: { height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  buyBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  coinsRow: { gap: 12, marginBottom: 12 },
  coinCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 16, alignItems: "center", gap: 6 },
  popularBadge: { position: "absolute", top: 0, right: 0, paddingHorizontal: 8, paddingVertical: 3, borderTopRightRadius: 14, borderBottomLeftRadius: 10 },
  popularText: { color: "#FFF", fontSize: 10, fontWeight: "700" },
  coinAmount: { fontSize: 28, fontWeight: "900" },
  bonusText: { fontSize: 12, fontWeight: "700" },
  coinPrice: { fontSize: 15, fontWeight: "700" },
  giftCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: "center", gap: 4, margin: 4 },
  giftEmoji: { fontSize: 32 },
  giftName: { fontSize: 11, fontWeight: "600", textAlign: "center" },
  giftCostRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  giftCost: { fontSize: 11, fontWeight: "700" },
});
