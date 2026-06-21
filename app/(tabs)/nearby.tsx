import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '@/components/Avatar';
import * as Haptics from 'expo-haptics';

interface NearbyUser {
  id: string; name: string; username?: string; photoURL: string | null;
  vipLevel: 0|1|2|3; distance: number; bio: string;
  online: boolean; points: number;
}

const NEARBY_DEMO: NearbyUser[] = [
  { id:'n1', name:'فرصة', photoURL:null, vipLevel:2, distance:0.3, bio:'رام اغملوا', online:true, points:1500 },
  { id:'n2', name:'أدمج', photoURL:null, vipLevel:0, distance:0.8, bio:'روصم رتحم', online:true, points:230 },
  { id:'n3', name:'نورة', photoURL:null, vipLevel:3, distance:1.2, bio:'اقثل او رفل', online:false, points:5000 },
  { id:'n4', name:'دلاخ', photoURL:null, vipLevel:1, distance:2.0, bio:'روطم اقيبطت', online:true, points:800 },
  { id:'n5', name:'ريم', photoURL:null, vipLevel:0, distance:3.1, bio:'قبل اج معقية', online:false, points:150 },
  { id:'n6', name:'فيص', photoURL:null, vipLevel:2, distance:4.5, bio:'ايحلل بحمو', online:true, points:2200 },
];
export default function NearbyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isWeb = Platform.OS === 'web';
  const router = useRouter();
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationGranted, setLocationGranted] = useState(false);
  const [activeTab, setActiveTab] = useState('normal');
  const [searchId, setSearchId] = useState('');

  useEffect(() => { requestLocation(); }, []);

  const requestLocation = async () => {
    setLoading(true);
    try {
      setLocationGranted(true);
      const { getFirestore, collection, onSnapshot } = await import("firebase/firestore");
      const db = getFirestore();
      onSnapshot(collection(db, "users"), (snap) => {
        const list = snap.docs
          .filter(doc => doc.id !== user?.uid)
          .map(doc => ({ id: doc.id, ...doc.data() } as NearbyUser));
        setNearbyUsers(list);
      });
    }
    catch { setNearbyUsers(NEARBY_DEMO); }
    finally { setLoading(false); }
  };

  const handleGift = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('هدية', 'هل تريد ارسال هدية لـ ' + name + '؟', [
      { text: 'الغاء', style: 'cancel' },
      { text: 'ارسال', onPress: () => Alert.alert('تم!', 'تم ارسال الهدية لـ ' + name) },
    ]);
  };

  const topPad = isWeb ? 67 : insets.top;

  const filteredUsers = nearbyUsers.filter(u =>
    u.name.toLowerCase().includes(searchId.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: topPad, backgroundColor: colors.background }]}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="بحث بالاسم..."
          placeholderTextColor={colors.textSecondary}
          value={searchId}
          onChangeText={setSearchId}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card }]}
              onPress={() => item.username && router.push(`/profile/${item.username}`)}
            >
              <Avatar uri={item.photoURL} name={item.name} size={56} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                <Text style={{ color: colors.textSecondary }} numberOfLines={1}>{item.bio}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {item.distance.toFixed(1)} كم · {item.online ? 'متصل الآن' : 'غير متصل'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleGift(item.name)}>
                <Ionicons name="gift-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textSecondary }}>
              لا يوجد مستخدمون قريبون حاليًا
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ffffff15',
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  name: { fontSize: 16, fontWeight: '600' },
});
