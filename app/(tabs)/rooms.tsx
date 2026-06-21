import { useState, useEffect, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove, deleteDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import VIPBadge from "@/components/VIPBadge";
import createAgoraRtcEngine, { ChannelProfileType, ClientRoleType } from "react-native-agora";

const AGORA_APP_ID = "41f1a9ef868041c2b093d3bf9ec32aeb";
const TOPICS = ["الكل", "موسيقى", "حواء", "أدب", "رياضة", "ثقافة", "تقنية"];

export default function RoomsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState("الكل");
  const [rooms, setRooms] = useState<any[]>([]);
  const [liveListenersCount, setLiveListenersCount] = useState(1);
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const engineRef = useRef<any>(null);

  useEffect(() => {
    const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const initAgora = async (channelName: string) => {
    try {
      const engine = createAgoraRtcEngine();
      engineRef.current = engine;
      engine.initialize({ appId: AGORA_APP_ID });
      engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
      engine.setClientRole(ClientRoleType.ClientRoleAudience);
      engine.enableAudio();
        engine.enableAudioVolumeIndication(200, 3, true);
      engine.joinChannel("", channelName, 0, {
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
        clientRoleType: ClientRoleType.ClientRoleAudience,
      });
    } catch (e) {
      console.log("Agora error:", e);
    }
  };

  const leaveAgora = () => {
    try {
      engineRef.current?.leaveChannel();
      engineRef.current?.release();
      engineRef.current = null;
    } catch {}
  };

  const joinRoom = async (room: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "rooms", room.id), {
        listeners: arrayUnion(user.uid),
        listenersCount: (room.listenersCount || 0) + 1,
      });
      setCurrentRoom(room);
      await initAgora(room.id);
    const roomRef2 = doc(db, "rooms", room.id);
    onSnapshot(roomRef2, (snap) => { setLiveListenersCount(snap.data()?.listenersCount || 1); });
    } catch {
      Alert.alert("خطأ", "فشل الانضمام");
    }
  };

  const leaveRoom = async () => {
    if (!currentRoom || !user) return;
    try {
      await updateDoc(doc(db, "rooms", currentRoom.id), {
        listeners: arrayRemove(user.uid),
        listenersCount: Math.max((currentRoom.listenersCount || 1) - 1, 0),
      });
      leaveAgora();
      setCurrentRoom(null);
      setIsMuted(false);
    } catch {}
  };

  const toggleMute = () => {
    engineRef.current?.muteLocalAudioStream(!isMuted);
    setIsMuted(!isMuted);
  };

  const createRoom = async (title: string, topic: string) => {
    if (!user || !title.trim()) return;
    try {
      const roomRef = await addDoc(collection(db, "rooms"), {
        title: title.trim(),
        topic,
        hostId: user.uid,
        hostName: profile?.displayName || "مجهول",
        hostVIP: profile?.vip || 0,
        listenersCount: 1,
        listeners: [user.uid],
        isLive: true,
        createdAt: serverTimestamp(),
      });
      const room = { id: roomRef.id, title: title.trim(), topic };
      setCurrentRoom(room);
      await initAgora(roomRef.id);
    } catch {
      Alert.alert("خطأ", "فشل إنشاء الغرفة");
    }
  };

  const filtered = selectedTopic === "الكل" ? rooms : rooms.filter(r => r.topic === selectedTopic);

  if (currentRoom) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.roomHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.roomTitle, { color: colors.text }]}>{currentRoom.title}</Text>
          <Text style={[styles.roomTopic, { color: colors.primary }]}>#{currentRoom.topic}</Text>
        </View>
        <View style={styles.roomCenter}>
          <Ionicons name="mic" size={80} color={colors.primary} />
          <Text style={[styles.roomLive, { color: colors.text }]}>🔴 مباشر</Text>
          <Text style={[styles.roomListeners, { color: colors.mutedForeground }]}>
            {liveListenersCount} مستمع
          </Text>
        </View>
        <View style={styles.roomActions}>
          <TouchableOpacity onPress={toggleMute} style={[styles.muteBtn, { backgroundColor: isMuted ? "#e74c3c" : colors.primary }]}>
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color="#fff" />
            <Text style={styles.muteBtnText}>{isMuted ? "كتم" : "مفتوح"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={leaveRoom} style={[styles.leaveBtn, { backgroundColor: "#e74c3c" }]}>
            <Ionicons name="exit-outline" size={28} color="#fff" />
            <Text style={styles.muteBtnText}>مغادرة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>الغرف الصوتية</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)} style={[styles.createBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.createBtnText}>غرفة جديدة</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topics}>
        {TOPICS.map(t => (
          <TouchableOpacity key={t} onPress={() => setSelectedTopic(t)}
            style={[styles.topicBtn, { backgroundColor: selectedTopic === t ? colors.primary : colors.card, borderColor: colors.border }]}>
            <Text style={[styles.topicText, { color: selectedTopic === t ? "#fff" : colors.text }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 12, gap: 12 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={styles.hostRow}>
                <Text style={[styles.hostName, { color: colors.text }]}>{item.hostName}</Text>
                {item.hostVIP > 0 && <VIPBadge level={item.hostVIP} />}
                <View style={styles.liveBadge}><Text style={styles.liveText}>مباشر</Text></View>
              </View>
              <Text style={[styles.listeners, { color: colors.mutedForeground }]}>
                {item.listenersCount || 0} 🎧
              </Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
            <View style={styles.tags}>
              <Text style={[styles.tag, { color: colors.primary }]}>#{item.topic}</Text>
            </View>
            <TouchableOpacity onPress={() => joinRoom(item)}
              style={[styles.joinBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="mic" size={16} color="#fff" />
              <Text style={styles.joinBtnText}>الانضمام</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {showCreate && (
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>غرفة جديدة</Text>
          {["موسيقى", "حوار", "أدب", "رياضة", "ثقافة", "تقنية"].map(topic => (
            <TouchableOpacity key={topic} onPress={() => { createRoom("غرفة " + profile?.displayName, topic); setShowCreate(false); }}
              style={[styles.topicBtn, { backgroundColor: colors.primary, marginBottom: 8 }]}>
              <Text style={{ color: "#fff" }}>{topic}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => setShowCreate(false)}>
            <Text style={{ color: "#e74c3c", textAlign: "center", marginTop: 8 }}>إلغاء</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: "800" },
  createBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  createBtnText: { color: "#fff", fontWeight: "700" },
  topics: { paddingHorizontal: 12, paddingVertical: 10 },
  topicBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  topicText: { fontWeight: "600" },
  card: { borderRadius: 16, padding: 14, borderWidth: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  hostRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  hostName: { fontWeight: "700" },
  liveBadge: { backgroundColor: "#e74c3c", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  liveText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  listeners: { fontSize: 13 },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  tags: { flexDirection: "row", gap: 6, marginBottom: 10 },
  tag: { fontSize: 12 },
  joinBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 10, borderRadius: 10 },
  joinBtnText: { color: "#fff", fontWeight: "700" },
  roomHeader: { padding: 16, borderBottomWidth: 1, alignItems: "center" },
  roomTitle: { fontSize: 20, fontWeight: "800" },
  roomTopic: { fontSize: 14, marginTop: 4 },
  roomCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  roomLive: { fontSize: 18, fontWeight: "700" },
  roomListeners: { fontSize: 16 },
  roomActions: { flexDirection: "row", justifyContent: "center", gap: 20, padding: 30 },
  muteBtn: { alignItems: "center", padding: 16, borderRadius: 50, gap: 6 },
  leaveBtn: { alignItems: "center", padding: 16, borderRadius: 50, gap: 6 },
  muteBtnText: { color: "#fff", fontWeight: "700" },
  modal: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: "800", textAlign: "center", marginBottom: 16 },
});
