import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const PURPLE = '#6E56CF';
const BG = '#F5F3FA';

type Recall = {
  id: string;
  title: string;
  issuer: 'FDA' | 'USDA' | string;
  image: string;
};

const DATA: Recall[] = [
  {
    id: 'r1',
    title: 'Spinach Recall',
    issuer: 'FDA',
    image:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=80',
  },
  {
    id: 'r2',
    title: 'Ground Beef Recall',
    issuer: 'USDA',
    image:
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&q=80',
  },
  {
    id: 'r3',
    title: 'Peanut Butter Recall',
    issuer: 'FDA',
    image:
      'https://images.unsplash.com/photo-1505575972945-270b6aebc74b?w=200&q=80',
  },
  {
    id: 'r4',
    title: 'Chicken Recall',
    issuer: 'USDA',
    image:
      'https://images.unsplash.com/photo-1548946526-f69e2424cf45?w=200&q=80',
  },
];

export default function RecallsScreen() {
  const router = useRouter();
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return DATA;
    return DATA.filter(
      r =>
        r.title.toLowerCase().includes(term) ||
        r.issuer.toLowerCase().includes(term),
    );
  }, [q]);

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <View style={s.header}>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#1A1523" />
        </Pressable>
        <Text style={s.headerTitle}>Recalls</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={s.searchWrap}>
        <Ionicons name="search" size={18} color="#7A6A9A" style={{ marginRight: 8 }} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search Recalls"
          placeholderTextColor="#9A8FBF"
          style={s.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={it => it.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListHeaderComponent={<Text style={s.section}>Recent Recalls</Text>}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <Pressable style={s.row} android_ripple={{ color: '#eee' }}
            onPress={() =>
              router.push({
                pathname: '/recalls/[id]',
                params: { id: item.id, title: item.title, issuer: item.issuer, image: item.image},
              })
            }
          >
            <Image source={{ uri: item.image }} style={s.thumb} />
            <View style={{ flex: 1 }}>
              <Text style={s.title} numberOfLines={1}>{item.title}</Text>
              <Text style={s.issuer}>Issued by {item.issuer}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#B8AEE0" />
          </Pressable>
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  header: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1523' },

  searchWrap: {
    marginHorizontal: 16,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEE9F7',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1523',
  },

  section: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1523',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#EDEDED',
  },
  title: { fontSize: 16, fontWeight: '800', color: '#1A1523' },
  issuer: { marginTop: 2, color: PURPLE, fontWeight: '700' },
});
