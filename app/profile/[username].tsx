import { useLocalSearchParams, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import Avatar from "@/components/Avatar";
import VIPBadge from "@/components/VIPBadge";
import { useColors } from "@/hooks/useColors";
import { VIP_DIAMOND, VIP_GOLD } from "@/constants/colors";

const VIP_NAMES: Record<number, string> = { 0: "", 1: "VIP فضي", 2: "VIP ذهبي", 3: "VIP ألماسي" };
const VIP_COLORS: Record<number, string> = { 0: "#9CA3AF", 1: "#9CA3AF", 2: VIP_GOLD, 3: VIP_DIAMOND };

interface PublicProfile {
  uid: string;
  displayName: string;
  username?: string;
  photoURL: string | null;
  bio?: string;
  points?: number;
  vipLevel?: 0 | 1 | 2 | 3;
  followersCount?: number;
  followingCount?: number;
}

export default function PublicProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { username } = useLocalSearchParams<{ username: string }>();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!username) return;
      setLoading(true);
      try {
        const db = getFirestore();
        const q = query(collection(db, "users"), where("username", "==", String(username).toLowerCase()));
        const snap = await getDocs(q);
        if (snap.empty) {
          setNotFound(true);
        } else {
          const doc = snap.docs[0];
          setProfile({ uid: doc.id, ...doc.data() } as PublicProfile);
        }
      } catch (e) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username]);

  const topPad = insets.top + 12;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (notFound || !profile) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 16, marginTop: 40 }}>المستخدم غير موجود</Text>
      </View>
    );
  }

  const vipLevel = profile.vipLevel ?? 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: topPad, paddingBottom: 40 }}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Avatar uri={profile.photoURL} name={profile.displayName} size={84} />
        <Text style={[styles.userName, { color: colors.text }]}>{profile.displayName}</Text>
        {profile.username && (
          <Text style={[styles.username, { color: colors.mutedForeground }]}>@{profile.username}</Text>
        )}
        {profile.bio ? (
          <Text style={[styles.bio, { color: colors.mutedForeground }]}>{profile.bio}</Text>
        ) : null}

        {vipLevel > 0 && (
          <View style={styles.vipRow}>
            <View style={[styles.vipLabel, { backgroundColor: VIP_COLORS[vipLevel] + "22", borderColor: VIP_COLORS[vipLevel] }]}>
              <Ionicons name={vipLevel === 3 ? "diamond" : "star"} size={14} color={VIP_COLORS[vipLevel]} />
              <Text style={[styles.vipLabelText, { color: VIP_COLORS[vipLevel] }]}>{VIP_NAMES[vipLevel]}</Text>
            </View>
            <VIPBadge level={vipLevel as 0 | 1 | 2 | 3} size="md" />
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="star" size={18} color={colors.gold} />
          <Text style={[styles.statNum, { color: colors.text }]}>{profile.points ?? 0}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>نقاط</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Ionicons name="people" size={18} color={colors.primary} />
          <Text style={[styles.statNum, { color: colors.text }]}>{profile.followersCount ?? 0}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>متابعون</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Ionicons name="person-add" size={18} color={colors.primary} />
          <Text style={[styles.statNum, { color: colors.text }]}>{profile.followingCount ?? 0}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>متابَعون</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  backBtn: { paddingHorizontal: 16, marginBottom: 8 },
  header: { alignItems: "center", paddingHorizontal: 24, gap: 6 },
  userName: { fontSize: 20, fontWeight: "800", marginTop: 12 },
  username: { fontSize: 14 },
  bio: { fontSize: 14, textAlign: "center", marginTop: 4 },
  vipRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  vipLabel: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, borderWidth: 1 },
  vipLabelText: { fontSize: 12, fontWeight: "700" },
  statsRow: { flexDirection: "row", marginTop: 28, marginHorizontal: 14 },
  stat: { flex: 1, alignItems: "center", gap: 4 },
  statNum: { fontSize: 16, fontWeight: "700" },
  statLabel: { fontSize: 12 },
  statDivider: { width: 1, height: 40 },
});
