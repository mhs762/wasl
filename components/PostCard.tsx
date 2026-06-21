import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import Avatar from "@/components/Avatar";
import VIPBadge from "@/components/VIPBadge";
import { useColors } from "@/hooks/useColors";
import { db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion, addDoc, collection, serverTimestamp } from "firebase/firestore";

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  authorVIP: 0 | 1 | 2 | 3;
  content: string;
  likes: string[];
  commentsCount: number;
  createdAt: number;
}

interface Props {
  post: Post;
  currentUserId: string | undefined;
  onLike: (postId: string) => void;
}

function timeAgo(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return "الآن";
  if (diff < 3600) return `${Math.floor(diff / 60)}د`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}س`;
  return `${Math.floor(diff / 86400)}ي`;
}

export default function PostCard({ post, currentUserId, onLike }: Props) {
  const colors = useColors();
  const router = useRouter();
  const [localLiked, setLocalLiked] = useState(post.likes?.includes(currentUserId ?? ''));
  const [localCount, setLocalCount] = useState(post.likes?.length || 0);

  const handleLike = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalLiked(!localLiked);
    setLocalCount(localLiked ? localCount - 1 : localCount + 1);
    onLike(post.id);
  };

  const handleComment = () => {
    router.push(`/post/${post.id}`);
  };

  const handleOptions = () => {
    const isOwner = currentUserId === post.authorId;
    if (isOwner) {
      Alert.alert("خيارات", "", [
        { text: "حذف المنشور", style: "destructive", onPress: () => deletePost() },
        { text: "إلغاء", style: "cancel" },
      ]);
    } else {
      Alert.alert("خيارات", "", [
        { text: "بلاغ", onPress: () => reportPost() },
        { text: "حظر المستخدم", style: "destructive", onPress: () => blockUser() },
        { text: "إلغاء", style: "cancel" },
      ]);
    }
  };

  const deletePost = async () => {
    try {
      const { deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "posts", post.id));
      Alert.alert("✅", "تم حذف المنشور");
    } catch {
      Alert.alert("خطأ", "فشل الحذف");
    }
  };

  const reportPost = async () => {
    try {
      await addDoc(collection(db, "reports"), {
        postId: post.id,
        reportedBy: currentUserId,
        authorId: post.authorId,
        createdAt: serverTimestamp(),
      });
      Alert.alert("✅", "تم إرسال البلاغ");
    } catch {
      Alert.alert("خطأ", "فشل إرسال البلاغ");
    }
  };

  const blockUser = async () => {
    try {
      await updateDoc(doc(db, "users", currentUserId ?? ""), {
        blockedUsers: arrayUnion(post.authorId),
      });
      Alert.alert("✅", "تم حظر المستخدم");
    } catch {
      Alert.alert("خطأ", "فشل الحظر");
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <Avatar uri={post.authorPhotoURL} name={post.authorName} size={42} />
          <View style={styles.authorInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.authorName, { color: colors.text }]}>{post.authorName}</Text>
              {post.authorVIP > 0 && <VIPBadge level={post.authorVIP} />}
            </View>
            <Text style={[styles.time, { color: colors.mutedForeground }]}>
              {timeAgo(post.createdAt)}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleOptions} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.content, { color: colors.text }]}>{post.content}</Text>

      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Ionicons
            name={localLiked ? "heart" : "heart-outline"}
            size={22}
            color={localLiked ? "#EF4444" : colors.mutedForeground}
          />
          {localCount > 0 && (
            <Text style={[styles.actionCount, { color: localLiked ? "#EF4444" : colors.mutedForeground }]}>
              {localCount}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleComment}>
          <Ionicons name="chatbubble-outline" size={22} color={colors.mutedForeground} />
          {post.commentsCount > 0 && (
            <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>
              {post.commentsCount}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, marginVertical: 6, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  authorInfo: { gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  authorName: { fontSize: 15, fontWeight: "700" },
  time: { fontSize: 12 },
  content: { paddingHorizontal: 14, paddingBottom: 14, fontSize: 15, lineHeight: 22, textAlign: "right" },
  actions: { flexDirection: "row", borderTopWidth: 1, paddingVertical: 8, paddingHorizontal: 14, gap: 20 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { fontSize: 13, fontWeight: "600" },
});
