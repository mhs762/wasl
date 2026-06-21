import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

export default function SetupUsernameScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updateUserProfile } = useAuth();

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(username);

  const handleSave = async () => {
    if (!isValid) {
      Alert.alert("اسم مستخدم غير صالح", "يجب أن يكون 3-20 حرفًا (إنجليزي وأرقام و _ فقط)");
      return;
    }
    setLoading(true);
    try {
      const db = getFirestore();
      const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        Alert.alert("غير متاح", "اسم المستخدم هذا مستخدم من قبل، جرّب اسمًا آخر");
        setLoading(false);
        return;
      }
      await updateUserProfile({ username: username.toLowerCase() });
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("خطأ", "تعذر حفظ اسم المستخدم: " + String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 40 }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={[styles.title, { color: colors.text }]}>اختر اسم مستخدم</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        سيُستخدم هذا الاسم للبحث عنك ولرابط ملفك الشخصي
      </Text>

      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
        placeholder="username"
        placeholderTextColor={colors.mutedForeground}
        value={username}
        onChangeText={(t) => setUsername(t.replace(/\s/g, ""))}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary, opacity: isValid ? 1 : 0.5 }]}
        onPress={handleSave}
        disabled={!isValid || loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>حفظ والاستمرار</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: "center", marginBottom: 28 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    textAlign: "left",
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
