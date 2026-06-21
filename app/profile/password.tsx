import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

export default function ChangePasswordScreen() {
  const colors = useColors();
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!current || !newPass || !confirm) {
      Alert.alert("خطأ", "أكمل جميع الحقول");
      return;
    }
    if (newPass !== confirm) {
      Alert.alert("خطأ", "كلمتا المرور غير متطابقتين");
      return;
    }
    if (newPass.length < 6) {
      Alert.alert("خطأ", "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    setSaving(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("غير مسجل");
      const credential = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPass);
      Alert.alert("✅", "تم تغيير كلمة المرور!");
      router.back();
    } catch (e: any) {
      if (e.code === "auth/wrong-password") {
        Alert.alert("خطأ", "كلمة المرور الحالية غير صحيحة");
      } else {
        Alert.alert("خطأ", "فشل تغيير كلمة المرور");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>تغيير كلمة المرور</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.text }]}>كلمة المرور الحالية</Text>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
          value={current}
          onChangeText={setCurrent}
          secureTextEntry
          placeholder="••••••"
          placeholderTextColor={colors.mutedForeground}
        />

        <Text style={[styles.label, { color: colors.text }]}>كلمة المرور الجديدة</Text>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
          value={newPass}
          onChangeText={setNewPass}
          secureTextEntry
          placeholder="••••••"
          placeholderTextColor={colors.mutedForeground}
        />

        <Text style={[styles.label, { color: colors.text }]}>تأكيد كلمة المرور</Text>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="••••••"
          placeholderTextColor={colors.mutedForeground}
        />

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: saving ? colors.muted : colors.primary }]}
          onPress={save}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? "جاري الحفظ..." : "تغيير"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: "700" },
  form: { padding: 16, gap: 8 },
  label: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  input: { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 15 },
  saveBtn: { borderRadius: 12, padding: 14, alignItems: "center", marginTop: 16 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
