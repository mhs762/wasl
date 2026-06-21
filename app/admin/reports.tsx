import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { collection, getDocs, orderBy, query, deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ReportsScreen() {
  const { profile } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.isAdmin) return;
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = await Promise.all(snap.docs.map(async d => {
        const r = { id: d.id, ...d.data() } as any;
        // جيب محتوى البوست
        try {
          const postSnap = await getDoc(doc(db, "posts", r.postId));
          r.postContent = postSnap.exists() ? postSnap.data()?.content : "تم الحذف";
        } catch { r.postContent = "غير متاح"; }
        return r;
      }));
      setReports(data);
    } finally {
      setLoading(false);
    }
  };

  const dismissReport = async (reportId: string) => {
    await deleteDoc(doc(db, "reports", reportId));
    setReports(prev => prev.filter(r => r.id !== reportId));
  };

  const deletePostAndReport = async (reportId: string, postId: string, authorId: string) => {
    Alert.alert("تأكيد", "حذف المنشور وحظر المستخدم؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "نعم", style: "destructive", onPress: async () => {
          try {
            await deleteDoc(doc(db, "posts", postId));
            await updateDoc(doc(db, "users", authorId), { banned: true });
            await deleteDoc(doc(db, "reports", reportId));
            setReports(prev => prev.filter(r => r.id !== reportId));
            Alert.alert("✅", "تم الحذف والحظر");
          } catch {
            Alert.alert("خطأ", "فشلت العملية");
          }
        }
      }
    ]);
  };

  if (!profile?.isAdmin) {
    return <View style={styles.center}><Text style={{ color: colors.text }}>غير مصرح</Text></View>;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>🚨 البلاغات ({reports.length})</Text>
        <TouchableOpacity onPress={loadReports}>
          <Ionicons name="refresh" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><Text style={{ color: colors.text }}>جاري التحميل...</Text></View>
      ) : reports.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
          <Text style={[styles.emptyText, { color: colors.text }]}>لا توجد بلاغات 🎉</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>المُبلَّغ عنه:</Text>
                <Text style={[styles.value, { color: colors.text }]}>{item.authorId}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>المُبلِّغ:</Text>
                <Text style={[styles.value, { color: colors.text }]}>{item.reportedBy}</Text>
              </View>
              <View style={[styles.contentBox, { backgroundColor: colors.background }]}>
                <Text style={[styles.postContent, { color: colors.text }]}>{item.postContent}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: "#4CAF50" }]}
                  onPress={() => dismissReport(item.id)}
                >
                  <Text style={styles.btnText}>تجاهل</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: "#e74c3c" }]}
                  onPress={() => deletePostAndReport(item.id, item.postId, item.authorId)}
                >
                  <Text style={styles.btnText}>حذف + حظر</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: "700" },
  emptyText: { fontSize: 16 },
  card: { borderRadius: 14, padding: 14, borderWidth: 1 },
  row: { flexDirection: "row", gap: 6, marginBottom: 4 },
  label: { fontSize: 12 },
  value: { fontSize: 12, fontWeight: "600", flex: 1 },
  contentBox: { borderRadius: 8, padding: 10, marginVertical: 8 },
  postContent: { fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: "row", gap: 8, marginTop: 4 },
  btn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
