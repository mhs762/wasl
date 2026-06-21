import { useState, useEffect } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import Avatar from "@/components/Avatar";

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [id]);

  const loadPost = async () => {
    const snap = await getDoc(doc(db, "posts", id));
    if (snap.exists()) setPost({ id: snap.id, ...snap.data() });
  };

  const loadComments = async () => {
    const q = query(collection(db, "posts", id, "comments"), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const sendComment = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    try {
      await addDoc(collection(db, "posts", id, "comments"), {
        authorId: user.uid,
        authorName: profile?.displayName || "مجهول",
        authorPhotoURL: profile?.photoURL || null,
        content: text.trim(),
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "posts", id), { commentsCount: increment(1) });
      setText("");
      loadComments();
    } catch {
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>التعليقات</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={comments}
        keyExtractor={i => i.id}
        ListHeaderComponent={post ? (
          <View style={[styles.postBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.postAuthor, { color: colors.text }]}>{post.authorName}</Text>
            <Text style={[styles.postContent, { color: colors.text }]}>{post.content}</Text>
          </View>
        ) : null}
        renderItem={({ item }) => (
          <View style={[styles.comment, { borderBottomColor: colors.border }]}>
            <Avatar uri={item.authorPhotoURL} name={item.authorName} size={34} />
            <View style={styles.commentContent}>
              <Text style={[styles.commentAuthor, { color: colors.text }]}>{item.authorName}</Text>
              <Text style={[styles.commentText, { color: colors.text }]}>{item.content}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      <View style={[styles.inputRow, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
          placeholder="اكتب تعليقاً..."
          placeholderTextColor={colors.mutedForeground}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity onPress={sendComment} disabled={sending || !text.trim()} style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: "700" },
  postBox: { margin: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  postAuthor: { fontWeight: "700", marginBottom: 6 },
  postContent: { fontSize: 15, lineHeight: 22 },
  comment: { flexDirection: "row", gap: 10, padding: 12, borderBottomWidth: 1 },
  commentContent: { flex: 1 },
  commentAuthor: { fontWeight: "700", fontSize: 13, marginBottom: 2 },
  commentText: { fontSize: 14, lineHeight: 20 },
  inputRow: { flexDirection: "row", alignItems: "center", padding: 10, gap: 8, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, maxHeight: 80 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
});
