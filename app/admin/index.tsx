import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, TextInput } from "react-native";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

export default function AdminPanel() {
  const { profile } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!profile?.isAdmin) return;
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const setVIP = async (userId: string, level: number) => {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    await updateDoc(doc(db, "users", userId), {
      vip: level,
      vipExpiry: expiry.toISOString()
    });
    loadUsers();
  };

  const removeVIP = async (userId: string) => {
    await updateDoc(doc(db, "users", userId), { vip: 0, vipExpiry: null });
    loadUsers();
  };

  const banUser = async (userId: string) => {
    await updateDoc(doc(db, "users", userId), { banned: true });
    loadUsers();
  };

  const unbanUser = async (userId: string) => {
    await updateDoc(doc(db, "users", userId), { banned: false });
    loadUsers();
  };

  // البحث بالاسم أو الإيميل أو الـ ID
  const filtered = users.filter(u => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.id?.toLowerCase().includes(q)
    );
  });

  if (!profile?.isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.text }}>غير مصرح لك بالدخول</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
      <Text style={[styles.title, { color: colors.text }]}>👑 لوحة المدير</Text>
      <TouchableOpacity onPress={() => router.push("/admin/reports")} style={[styles.reportsBtn, { backgroundColor: "#e74c3c" }]}>
        <Ionicons name="warning" size={16} color="#fff" />
        <Text style={styles.reportsBtnText}>البلاغات</Text>
      </TouchableOpacity>
    </View>
      <Text style={[styles.count, { color: colors.mutedForeground }]}>
        عدد المستخدمين: {users.length}
      </Text>

      <TextInput
        style={[styles.search, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="ابحث بالاسم أو الإيميل أو الـ ID..."
        placeholderTextColor={colors.mutedForeground}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.userInfo}>
              <Text style={[styles.name, { color: colors.text }]}>{item.displayName || "مجهول"}</Text>
              <Text style={[styles.email, { color: colors.mutedForeground }]}>{item.email || "لا يوجد إيميل"}</Text>
              <Text style={[styles.idText, { color: colors.mutedForeground }]}>ID: {item.id}</Text>
              <Text style={[styles.vip, { color: colors.primary }]}>
                VIP: {item.vip || 0} {item.banned ? "🚫" : ""}
              </Text>
              {item.vipExpiry && (
                <Text style={[styles.email, { color: colors.mutedForeground }]}>
                  ينتهي: {new Date(item.vipExpiry).toLocaleDateString("ar")}
                </Text>
              )}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setVIP(item.id, 1)} style={[styles.btn, { backgroundColor: "#C0C0C0" }]}>
                <Text style={styles.btnText}>Silver</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setVIP(item.id, 2)} style={[styles.btn, { backgroundColor: "#FFD700" }]}>
                <Text style={styles.btnText}>Gold</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setVIP(item.id, 3)} style={[styles.btn, { backgroundColor: "#00BFFF" }]}>
                <Text style={styles.btnText}>VIP+</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeVIP(item.id)} style={[styles.btn, { backgroundColor: "#888" }]}>
                <Text style={styles.btnText}>إلغاء VIP</Text>
              </TouchableOpacity>
              {item.banned ? (
                <TouchableOpacity onPress={() => unbanUser(item.id)} style={[styles.btn, { backgroundColor: "#4CAF50" }]}>
                  <Text style={styles.btnText}>رفع الحظر</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => Alert.alert("حظر", "هل تريد حظر هذا المستخدم؟", [
                  { text: "إلغاء" },
                  { text: "حظر", onPress: () => banUser(item.id) }
                ])} style={[styles.btn, { backgroundColor: "#e74c3c" }]}>
                  <Text style={styles.btnText}>حظر</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  reportsBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  reportsBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 4 },
  count: { textAlign: "center", marginBottom: 12 },
  search: { borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, textAlign: "right" },
  userCard: { borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1 },
  userInfo: { marginBottom: 8 },
  name: { fontSize: 15, fontWeight: "700" },
  email: { fontSize: 12 },
  idText: { fontSize: 11, marginTop: 2 },
  vip: { fontSize: 12, fontWeight: "600" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  btn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  btnText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
