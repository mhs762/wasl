import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useRouter } from "expo-router";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "@/components/Avatar";
import VIPBadge from "@/components/VIPBadge";
import { useAuth } from "@/context/AuthContext";
import { ACCENT_COLORS, ThemeColor, VIP_DIAMOND, VIP_GOLD } from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { storage } from "@/lib/firebase";

const THEME_COLORS: { key: ThemeColor; label: string }[] = [
  { key: "purple", label: "بنفسجي" },
  { key: "blue", label: "أزرق" },
  { key: "green", label: "أخضر" },
  { key: "orange", label: "برتقالي" },
  { key: "pink", label: "وردي" },
  { key: "red", label: "أحمر" },
];

const VIP_NAMES: Record<number, string> = { 0: "عادي", 1: "VIP فضي", 2: "VIP ذهبي", 3: "VIP ألماسي" };
const VIP_COLORS: Record<number, string> = { 0: "#9CA3AF", 1: "#9CA3AF", 2: VIP_GOLD, 3: VIP_DIAMOND };

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, profile, logout, updateUserProfile } = useAuth();
  const { colorScheme, accentColor, setColorScheme, setAccentColor } = useTheme();
  const isWeb = Platform.OS === "web";
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleChangePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("إذن مطلوب", "يرجى السماح بالوصول إلى مكتبة الصور");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (result.canceled || !result.assets[0]) return;
      if (!user) return;
      setUploadingPhoto(true);
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `avatars/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      await updateUserProfile({ photoURL: url });
      Alert.alert("تم!", "تم تحديث صورتك الشخصية");
    } catch (e) {
        Alert.alert("خطأ", "فشل تحديث الصورة: " + String(e));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("تسجيل الخروج", "هل أنت متأكد؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "خروج",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>حسابي</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: isWeb ? 34 : 100 }}>
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity onPress={handleChangePhoto} style={styles.avatarWrap}>
            {uploadingPhoto ? (
              <View style={[styles.avatarLoader, { backgroundColor: colors.muted }]}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <Avatar uri={profile?.photoURL} name={profile?.displayName} size={84} />
            )}
            <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={12} color="#FFF" />
            </View>
          </TouchableOpacity>

          <Text style={[styles.userName, { color: colors.text }]}>
            {profile?.displayName ?? user?.email ?? "المستخدم"}
          </Text>
          {profile?.bio ? (
            <Text style={[styles.bio, { color: colors.mutedForeground }]}>{profile.bio}</Text>
          ) : null}

          <View style={styles.vipRow}>
            <View style={[styles.vipLabel, { backgroundColor: VIP_COLORS[profile?.vipLevel ?? 0] + "22", borderColor: VIP_COLORS[profile?.vipLevel ?? 0] }]}>
              <Ionicons name={profile?.vipLevel === 3 ? "diamond" : "star"} size={14} color={VIP_COLORS[profile?.vipLevel ?? 0]} />
              <Text style={[styles.vipLabelText, { color: VIP_COLORS[profile?.vipLevel ?? 0] }]}>
                {VIP_NAMES[profile?.vipLevel ?? 0]}
              </Text>
            </View>
            <VIPBadge level={(profile?.vipLevel ?? 0) as 0 | 1 | 2 | 3} size="md" />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="star" size={18} color={colors.gold} />
              <Text style={[styles.statNum, { color: colors.text }]}>{profile?.points ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>نقاط</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Ionicons name="people" size={18} color={colors.primary} />
              <Text style={[styles.statNum, { color: colors.text }]}>{profile?.followersCount ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>متابعون</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Ionicons name="person-add" size={18} color={colors.primary} />
              <Text style={[styles.statNum, { color: colors.text }]}>{profile?.followingCount ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>أتابعهم</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>المظهر</Text>
          <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>الوضع</Text>
            <View style={styles.modeRow}>
              {(["dark", "light", "system"] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeBtn,
                    {
                      backgroundColor: colorScheme === mode ? colors.primary : colors.muted,
                      borderColor: colorScheme === mode ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setColorScheme(mode)}
                >
                  <Ionicons
                    name={mode === "dark" ? "moon" : mode === "light" ? "sunny" : "phone-portrait"}
                    size={16}
                    color={colorScheme === mode ? "#FFF" : colors.mutedForeground}
                  />
                  <Text style={[styles.modeBtnText, { color: colorScheme === mode ? "#FFF" : colors.mutedForeground }]}>
                    {mode === "dark" ? "داكن" : mode === "light" ? "فاتح" : "تلقائي"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>لون التمييز</Text>
            <View style={styles.colorsRow}>
              {THEME_COLORS.map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.colorDot,
                    { backgroundColor: ACCENT_COLORS[key].primary },
                    accentColor === key && styles.colorDotActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAccentColor(key);
                  }}
                >
                  {accentColor === key && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>الحساب</Text>
          {[
            { icon: "person-outline", label: "تعديل الملف الشخصي" },
            { icon: "lock-closed-outline", label: "تغيير كلمة المرور" },
            { icon: "notifications-outline", label: "الإشعارات" },
            { icon: "shield-outline", label: "الخصوصية والأمان" },
            { icon: "help-circle-outline", label: "المساعدة والدعم" },
          ].map(({ icon, label }) => (
            <TouchableOpacity
              key={label}
              style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => { if (label === "لوحة المدير 👑") { router.push("/admin"); } else if (label === "الخصوصية والأمان") { router.push("/profile/privacy"); } else { if (label === "تعديل الملف الشخصي") { router.push("/profile/edit"); } else if (label === "تغيير كلمة المرور") { router.push("/profile/password"); } else { if (label === "تعديل الملف الشخصي") { router.push("/profile/edit"); } else if (label === "تغيير كلمة المرور") { router.push("/profile/password"); } else { Alert.alert(label, "قريباً") } }; } }}
            >
              <Ionicons name={icon as never} size={20} color={colors.primary} />
              <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
              <Ionicons name="chevron-back" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.destructive }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 24, fontWeight: "800" },
  profileCard: {
    margin: 14,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  avatarWrap: { position: "relative" },
  avatarLoader: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center" },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  userName: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  bio: { fontSize: 14, textAlign: "center" },
  vipRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  vipLabel: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  vipLabelText: { fontSize: 13, fontWeight: "700" },
  statsRow: { flexDirection: "row", alignItems: "center", width: "100%", justifyContent: "center", gap: 0 },
  stat: { flex: 1, alignItems: "center", gap: 4 },
  statNum: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 12 },
  statDivider: { width: 1, height: 40 },
  section: { marginHorizontal: 14, marginBottom: 16, gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  settingCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  settingLabel: { fontSize: 15, fontWeight: "700", textAlign: "right" },
  modeRow: { flexDirection: "row", gap: 8 },
  modeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  modeBtnText: { fontSize: 13, fontWeight: "600" },
  colorsRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  colorDotActive: { borderWidth: 3, borderColor: "#FFF" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  menuLabel: { flex: 1, fontSize: 15 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  logoutText: { fontSize: 15, fontWeight: "700" },
});
