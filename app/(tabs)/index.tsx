import { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Platform, RefreshControl, Alert
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PostCard, { Post } from "@/components/PostCard";
import StoryBar, { Story } from "@/components/StoryBar";
import StoryViewer from "@/components/StoryViewer";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { db } from "@/lib/firebase";
import {
  addDoc, arrayRemove, arrayUnion, collection,
  getDocs, limit, orderBy, query, updateDoc, doc,
  onSnapshot, serverTimestamp, deleteDoc
} from "firebase/firestore";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const isWeb = Platform.OS === "web";

  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [viewingStory, setViewingStory] = useState<{ stories: Story[]; index: number } | null>(null);

  // جلب القصص من Firebase
  useEffect(() => {
    const q = query(collection(db, "stories"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const now = Date.now();
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(s => {
          // القصص تنتهي بعد 24 ساعة
          const created = s.createdAt?.toMillis?.() || 0;
          return now - created < 24 * 60 * 60 * 1000;
        });
      setStories(data);
    });
    return () => unsub();
  }, []);

  // جلب البوستات
  const fetchPosts = useCallback(async () => {
    try {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(30));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      setPosts(data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const onRefresh = () => { setRefreshing(true); fetchPosts(); };

  // إضافة قصة
  const handleAddStory = async () => {
    const { status } = await import("expo-image-picker").then(m => m.requestMediaLibraryPermissionsAsync());
    if (status !== "granted") { Alert.alert("خطأ", "نحتاج إذن للوصول للصور"); return; }
    const result = await import("expo-image-picker").then(m =>
      m.launchImageLibraryAsync({ mediaTypes: ["images", "videos"], allowsEditing: true, aspect: [9, 16], quality: 0.8 })
    );
    if (!result.canceled && user) {
      try {
        await addDoc(collection(db, "stories"), {
          authorId: user.uid,
          authorName: profile?.displayName || "أنت",
          authorPhotoURL: profile?.photoURL || null,
          mediaURL: result.assets[0].uri,
              mediaType: result.assets[0].type || "image",
          seen: false,
          createdAt: serverTimestamp(),
        });
        Alert.alert("✅", "تمت إضافة القصة!");
      } catch {
        Alert.alert("خطأ", "فشل رفع القصة");
      }
    }
  };

  // نشر بوست
  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    setPosting(true);
    try {
      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorName: profile?.displayName || "مجهول",
        authorPhotoURL: profile?.photoURL || null,
        authorVIP: profile?.vip || 0,
        content: newPost.trim(),
        likes: [],
        commentsCount: 0,
        createdAt: serverTimestamp(),
      });
      setNewPost("");
      fetchPosts();
    } catch {
      Alert.alert("خطأ", "فشل النشر");
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (post: Post) => {
    if (!user) return;
    const ref = doc(db, "posts", post.id);
    const liked = post.likes?.includes(user.uid);
    await updateDoc(ref, { likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid) });
    fetchPosts();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.logo, { color: colors.primary }]}>وصل</Text>
      </View>
      <FlatList
        data={posts}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <StoryBar stories={stories} onAddStory={handleAddStory} currentUserId={user?.uid} onViewStory={(story) => {
              const idx = stories.findIndex(s => s.id === story.id);
              setViewingStory({ stories, index: idx >= 0 ? idx : 0 });
            }} />
            {viewingStory && (
              <StoryViewer
                stories={viewingStory.stories}
                startIndex={viewingStory.index}
                onClose={() => setViewingStory(null)}
              />
            )}
            <View style={[styles.composeBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.composeInput, { color: colors.text }]}
                placeholder="شاركنا شيء..."
                placeholderTextColor={colors.muted}
                value={newPost}
                onChangeText={setNewPost}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.postBtn, { backgroundColor: newPost.trim() ? colors.primary : colors.muted }]}
                onPress={handlePost}
                disabled={posting || !newPost.trim()}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>نشر</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <PostCard post={item} onLike={() => handleLike(item)} currentUserId={user?.uid} />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: isWeb ? 34 : 100 }]}
        scrollEnabled={!!posts.length || !loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  logo: { fontSize: 28, fontWeight: "900" },
  listContent: { paddingBottom: 100 },
  composeBox: { margin: 12, borderRadius: 16, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "flex-end", gap: 10, minHeight: 56 },
  composeInput: { flex: 1, fontSize: 15, maxHeight: 100 },
  postBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16 },
});
