import {SafeAreaView} from 'react-native-safe-area-context';
import {View, Text, StyleSheet, Pressable, Image} from 'react-native';
import {useRouter} from 'expo-router';
import React from "react";
import {useAuth} from "@/app/context/auth_context";

const PURPLE = '#6E56CF';

export default function Home() {
    const { user, logout, refreshUser } = useAuth();

    const router = useRouter();
    return (
        <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
            <View style={s.header}>
                <Pressable onPress={() => router.push('/profile')}>
                    <Image
                        source={{uri: 'https://i.pravatar.cc/100?img=12'}}
                        style={s.avatar}
                    />
                </Pressable>
                <Text style={s.headerTitle}>Home</Text>
                <View style={{width: 40}}/>
            </View>

      <View style={s.card}>
        <Text style={s.h1}>Welcome back, <Text style={{color:'#111'}}>{user?.first_name}</Text></Text>
        <Text style={s.sub}>
          Here’s a quick overview of your pantry and recent activity.
        </Text>
      </View>

      {/* Pantry Summary */}
      <Text style={s.sectionTitle}>Pantry Summary</Text>

      <View style={s.row}>
        <SummaryTile
          icon="🧺"
          title="Total Items"
          subtitle="12 items"
        />
        <SummaryTile
          icon="🕒"
          title="Expiring Soon"
          subtitle="Expires in 7 days"
        />
      </View>

      {/* Recent Activity */}
      <Text style={[s.sectionTitle, { marginTop: 18 }]}>Recent Activity</Text>

      <ActivityItem icon="＋" title="Today" subtitle="Added 3 items" />
      <ActivityItem icon="—" title="Yesterday" subtitle="Used 2 items" />

    </SafeAreaView>
  );
}

function SummaryTile({
  icon, title, subtitle,
}: { icon: string; title: string; subtitle: string }) {
  return (
    <View style={s.tile}>
      <View style={s.tileIconWrap}>
        <Text style={s.tileIcon}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.tileTitle}>{title}</Text>
        <Pressable onPress={() => {}}>
          <Text style={s.tileLink}>{subtitle}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ActivityItem({
  icon, title, subtitle,
}: { icon: string; title: string; subtitle: string }) {
  return (
    <View style={s.activity}>
      <View style={s.activityIconWrap}>
        <Text style={s.activityIcon}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.activityTitle}>{title}</Text>
        <Text style={s.activitySub}>{subtitle}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F2F2F6',
    paddingHorizontal: 16,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#ddd',
  },

  card: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  h1: { fontSize: 28, fontWeight: '900', color: '#1A1523' },
  sub: { marginTop: 8, fontSize: 16, lineHeight: 22, color: '#5F5F5F' },

  sectionTitle: {
    marginTop: 16,
    marginBottom: 10,
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1523',
  },

  row: { flexDirection: 'row', gap: 12 },
  tile: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  tileIconWrap: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#F0EFFE',
    alignItems: 'center', justifyContent: 'center',
  },
  tileIcon: { fontSize: 22 },
  tileTitle: { fontSize: 16, fontWeight: '800', color: '#1A1523' },
  tileLink: { marginTop: 4, fontSize: 15, color: PURPLE, fontWeight: '700' },

  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  activityIconWrap: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#F6F1FF',
    alignItems: 'center', justifyContent: 'center',
  },
  activityIcon: { fontSize: 20, color: '#333' },
  activityTitle: { fontSize: 18, fontWeight: '800', color: '#1A1523' },
  activitySub: { marginTop: 2, color: '#8A63D2', fontWeight: '700' },
});
