import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function EditProfileScreen() {
  const { user, profile } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user || !displayName.trim()) {
      Alert.alert("خطأ", "الاسم مطلوب");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim(),
        bio: bio.trim(),
      });
      Alert.alert("✅", "تم الحفظ!");
      router.back();
    } catch {
      Alert.alert("خطأ", "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>تعديل الملف</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.text }]}>الاسم</Text>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="اسمك"
          placeholderTextColor={colors.mutedForeground}
        />

        <Text style={[styles.label, { color: colors.text }]}>نبذة عنك</Text>
        <TextInput
          style={[styles.input, styles.bioInput, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
          value={bio}
          onChangeText={setBio}
          placeholder="اكتب نبذة قصيرة..."
          placeholderTextColor={colors.mutedForeground}
          multiline
        />

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: saving ? colors.muted : colors.primary }]}
          onPress={save}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? "جاري الحفظ..." : "حفظ"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: "700" },
  form: { padding: 16, gap: 8 },
  label: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  input: { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 15 },
  bioInput: { height: 100, textAlignVertical: "top" },
  saveBtn: { borderRadius: 12, padding: 14, alignItems: "center", marginTop: 16 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
