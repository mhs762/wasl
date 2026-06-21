import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "@/components/Avatar";
import VIPBadge from "@/components/VIPBadge";
import { useColors } from "@/hooks/useColors";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantPhotoURL: string | null;
  participantVIP: 0 | 1 | 2 | 3;
  lastMessage: string;
  lastMessageTime: number;
  unread: number;
  online: boolean;
}

function timeAgo(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return "الآن";
  if (diff < 3600) return `${Math.floor(diff / 60)}د`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}س`;
  return `${Math.floor(diff / 86400)}ي`;
}

const DEMO_CONVOS: Conversation[] = [
  { id: "c1", participantId: "u1", participantName: "سارة أحمد", participantPhotoURL: null, participantVIP: 2, lastMessage: "كيف حالك؟ 😊", lastMessageTime: Date.now() - 120000, unread: 2, online: true },
  { id: "c2", participantId: "u2", participantName: "محمد علي", participantPhotoURL: null, participantVIP: 0, lastMessage: "شكراً جزيلاً!", lastMessageTime: Date.now() - 3600000, unread: 0, online: false },
  { id: "c3", participantId: "u3", participantName: "نورة الشمري", participantPhotoURL: null, participantVIP: 1, lastMessage: "متى نلتقي؟", lastMessageTime: Date.now() - 7200000, unread: 1, online: true },
  { id: "c4", participantId: "u4", participantName: "خالد المطيري", participantPhotoURL: null, participantVIP: 3, lastMessage: "رائع جداً 👌", lastMessageTime: Date.now() - 86400000, unread: 0, online: false },
];

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isWeb = Platform.OS === "web";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (!user) { setConversations(DEMO_CONVOS); setLoading(false); return; }
        const q = query(
          collection(db, "conversations"),
          where("participants", "array-contains", user.uid),
          orderBy("lastMessageTime", "desc"),
          limit(50)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          setConversations(DEMO_CONVOS);
        } else {
          setConversations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conversation)));
        }
      } catch {
        setConversations(DEMO_CONVOS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const filtered = search
    ? conversations.filter((c) => c.participantName.includes(search))
    : conversations;

  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>الرسائل</Text>
        <TouchableOpacity>
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="بحث..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
          textAlign="right"
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.convoRow, { borderBottomColor: colors.border }]}
              onPress={() => router.push({ pathname: "/chat/[id]", params: { id: item.participantId, name: item.participantName } })}
            >
              <Avatar
                uri={item.participantPhotoURL}
                name={item.participantName}
                size={52}
                online={item.online}
              />
              <View style={styles.convoInfo}>
                <View style={styles.convoTop}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: colors.text }]}>{item.participantName}</Text>
                    {item.participantVIP > 0 && <VIPBadge level={item.participantVIP} />}
                  </View>
                  <Text style={[styles.time, { color: colors.mutedForeground }]}>
                    {timeAgo(item.lastMessageTime)}
                  </Text>
                </View>
                <View style={styles.convoBottom}>
                  <Text style={[styles.lastMsg, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                  {item.unread > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.badgeText}>{item.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد رسائل</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: isWeb ? 34 : 100 }}
          scrollEnabled={!!filtered.length}
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
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
    marginVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  convoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  convoInfo: { flex: 1, gap: 4 },
  convoTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 16, fontWeight: "700" },
  time: { fontSize: 12 },
  convoBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  lastMsg: { fontSize: 14, flex: 1 },
  badge: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#FFF", fontSize: 11, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16 },
});
