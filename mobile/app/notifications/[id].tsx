import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const PURPLE = '#6E56CF';
const BG = '#F5F3FA';

export default function NotificationDetail() {
  const router = useRouter();
  const { title, body, from, timeAgo } = useLocalSearchParams<{
    title?: string;
    body?: string;
    from?: string;
    timeAgo?: string;
  }>();

  const onDismiss = () => {
    // static for now
    Alert.alert('Dismissed');
    router.back();
  };

  const onArchive = () => {
    // static for now
    Alert.alert('Archived');
    router.back();
  };

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <View style={s.header}>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#1A1523" />
        </Pressable>
        <Text style={s.headerTitle}>Notification</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={s.title}>{title ?? 'New Recipe Alert: Spicy Chicken Tacos'}</Text>

        <Text style={s.body}>
          {body ??
            "Chef Isabella Rossi just shared a new recipe for Spicy Chicken Tacos. It’s a must-try for your next Taco Tuesday!"}
        </Text>

        <Pressable onPress={() => {  }}>
          <Text style={s.meta}>From: {from ?? 'Chef Isabella Rossi'}</Text>
        </Pressable>

        <Text style={s.meta}>Received: {timeAgo ?? '2 hours ago'}</Text>
      </ScrollView>

      <View style={s.footer}>
        <Pressable style={s.ghostBtn} onPress={onDismiss}>
          <Text style={s.ghostText}>Dismiss</Text>
        </Pressable>
        <Pressable style={s.primaryBtn} onPress={onArchive}>
          <Text style={s.primaryText}>Archive</Text>
        </Pressable>
      </View>
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

  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1523',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: '#3C3C43',
    marginBottom: 18,
  },
  meta: {
    color: PURPLE,
    fontWeight: '700',
    marginTop: 6,
  },

  footer: {
    margin: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  ghostBtn: {
    flex: 1,
    backgroundColor: '#ECE7F7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostText: { fontWeight: '700', color: '#1A1523' },

  primaryBtn: {
    flex: 1,
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: { fontWeight: '800', color: '#fff' },
});
