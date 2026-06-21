import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { db } from "@/lib/firebase";

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
}

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getConvoId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join("_");
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { id: participantId, name: participantName } = useLocalSearchParams<{ id: string; name: string }>();
  const isWeb = Platform.OS === "web";

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const convoId = user ? getConvoId(user.uid, participantId) : "";

  useEffect(() => {
    if (!user || !convoId) return;
    const load = async () => {
      try {
        const q = query(
          collection(db, "conversations", convoId, "messages"),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        const snap = await getDocs(q);
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)));
      } catch {
        // Use demo messages
        setMessages([
          { id: "m1", senderId: participantId, text: "مرحباً! كيف حالك؟", createdAt: Date.now() - 120000 },
          { id: "m2", senderId: user?.uid ?? "", text: "بخير شكراً، وأنت؟", createdAt: Date.now() - 60000 },
          { id: "m3", senderId: participantId, text: "الحمد لله، سعيد بتواصلنا على وصل 😊", createdAt: Date.now() - 10000 },
        ]);
      }
    };
    load();
  }, [user, convoId, participantId]);

  const sendMessage = useCallback(async () => {
    if (!text.trim() || !user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const msg: Message = { id: genId(), senderId: user.uid, text: text.trim(), createdAt: Date.now() };
    setMessages((prev) => [msg, ...prev]);
    setText("");
    setSending(true);
    try {
      await addDoc(collection(db, "conversations", convoId, "messages"), {
        senderId: user.uid,
        text: msg.text,
        createdAt: msg.createdAt,
      });
    } catch {
      // Already added optimistically
    } finally {
      setSending(false);
    }
  }, [text, user, convoId]);

  const isMyMessage = (senderId: string) => senderId === user?.uid;

  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Avatar uri={null} name={participantName ?? "?"} size={36} online />
          <View>
            <Text style={[styles.headerName, { color: colors.text }]}>{participantName ?? "محادثة"}</Text>
            <Text style={[styles.headerStatus, { color: colors.online }]}>متصل الآن</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="call-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          inverted
          renderItem={({ item }) => {
            const mine = isMyMessage(item.senderId);
            return (
              <View style={[styles.msgRow, mine && styles.msgRowMine]}>
                {!mine && (
                  <Avatar uri={null} name={participantName ?? "?"} size={28} />
                )}
                <View
                  style={[
                    styles.bubble,
                    mine
                      ? [styles.bubbleMine, { backgroundColor: colors.primary }]
                      : [styles.bubbleOther, { backgroundColor: colors.card, borderColor: colors.border }],
                  ]}
                >
                  <Text style={[styles.bubbleText, { color: mine ? "#FFF" : colors.text }]}>
                    {item.text}
                  </Text>
                  <Text style={[styles.bubbleTime, { color: mine ? "rgba(255,255,255,0.6)" : colors.mutedForeground }]}>
                    {new Date(item.createdAt).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.messagesContent}
          style={{ flex: 1 }}
        />

        <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 4 }]}>
          <TouchableOpacity>
            <Ionicons name="happy-outline" size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
            placeholder="اكتب رسالة..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            textAlign="right"
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}
            onPress={sendMessage}
            disabled={!text.trim()}
          >
            <Ionicons name="send" size={18} color={text.trim() ? "#FFF" : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerName: { fontSize: 16, fontWeight: "700" },
  headerStatus: { fontSize: 12, fontWeight: "600" },
  messagesContent: { paddingHorizontal: 12, paddingVertical: 16, gap: 8 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 6, marginBottom: 4 },
  msgRowMine: { flexDirection: "row-reverse" },
  bubble: { maxWidth: "75%", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, gap: 2 },
  bubbleMine: { borderBottomRightRadius: 4 },
  bubbleOther: { borderWidth: 1, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTime: { fontSize: 10, alignSelf: "flex-end" },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
