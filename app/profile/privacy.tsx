import { View, Text, StyleSheet, Switch, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { Stack } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

export default function PrivacyScreen() {
  const { user } = useAuth();
  const [location, setLocationState] = useState(true);
  const [notifications, setNotificationsState] = useState(true);
  const [twoFactor, setTwoFactorState] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const db = getFirestore();
    getDoc(doc(db, "users", user.uid)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setLocationState(d.locationSharing ?? true);
        setNotificationsState(d.notifications ?? true);
        setTwoFactorState(d.twoFactor ?? false);
      }
      setLoading(false);
    });
  }, [user]);

  const save = async (key: string, value: boolean) => {
    if (!user) return;
    const db = getFirestore();
    await updateDoc(doc(db, "users", user.uid), { [key]: value });
  };

  const setLocation = (v: boolean) => { setLocationState(v); save("locationSharing", v); };
  const setNotifications = (v: boolean) => { setNotificationsState(v); save("notifications", v); };
  const setTwoFactor = (v: boolean) => { setTwoFactorState(v); save("twoFactor", v); };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "الخصوصية والأمان" }} />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الخصوصية</Text>
        <View style={styles.item}>
          <Switch value={location} onValueChange={setLocation} />
          <Text style={styles.itemText}>مشاركة الموقع</Text>
        </View>
        <View style={styles.item}>
          <Switch value={notifications} onValueChange={setNotifications} />
          <Text style={styles.itemText}>الإشعارات</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الأمان</Text>
        <View style={styles.item}>
          <Switch value={twoFactor} onValueChange={setTwoFactor} />
          <Text style={styles.itemText}>التحقق بخطوتين</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  section: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, textAlign: "right" },
  item: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  itemText: { fontSize: 15, textAlign: "right" },
});
