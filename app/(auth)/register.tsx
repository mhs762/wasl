import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("تنبيه", "يرجى تعبئة جميع الحقول");
      return;
    }
    if (password.length < 6) {
      Alert.alert("تنبيه", "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      await register(email.trim(), password, name.trim());
      router.replace("/(tabs)");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "فشل إنشاء الحساب";
      Alert.alert("خطأ", msg.includes("already") ? "البريد الإلكتروني مستخدم بالفعل" : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>إنشاء حساب</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Ionicons name="person-outline" size={20} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="الاسم الكامل"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
              textAlign="right"
            />
          </View>

          <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Ionicons name="mail-outline" size={20} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="البريد الإلكتروني"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign="right"
            />
          </View>

          <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowPass((v) => !v)}>
              <Ionicons
                name={showPass ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="كلمة المرور (6 أحرف على الأقل)"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              textAlign="right"
            />
          </View>

          <Text style={[styles.terms, { color: colors.mutedForeground }]}>
            بالتسجيل توافق على شروط الاستخدام وسياسة الخصوصية
          </Text>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnText}>إنشاء الحساب</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            لديك حساب بالفعل؟
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.link, { color: colors.primary }]}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 24, gap: 28 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 22, fontWeight: "800" },
  form: { gap: 14 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
    height: 54,
  },
  input: { flex: 1, fontSize: 16 },
  terms: { fontSize: 12, textAlign: "center", lineHeight: 18 },
  btn: {
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  btnText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  footer: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: "auto" },
  footerText: { fontSize: 14 },
  link: { fontSize: 14, fontWeight: "700" },
});
