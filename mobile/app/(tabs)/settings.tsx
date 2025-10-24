import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from "@/app/context/auth_context";

const PURPLE = '#2563EB';
const BG = '#F5F3FA';

export default function SettingsScreen() {
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      router.replace('/login');
    } catch (e: any) {
      Alert.alert('Logout Failed', e?.response?.data?.error ?? e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#1A1523" />
        </Pressable>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <Text style={s.section}>Account</Text>
        <Row label="Change Password" onPress={() => { }} />
        <Row label="Privacy and Security" onPress={() => { }} />
        <Row label="Log Out" onPress={handleLogout} />

        <Text style={s.section}>Notifications</Text>
        <RowSwitch
          label="Push Notifications"
          value={pushEnabled}
          onValueChange={setPushEnabled}
        />
        <RowSwitch
          label="Sound"
          value={soundEnabled}
          onValueChange={setSoundEnabled}
        />

        {/* Preferences */}
        <Text style={s.section}>App Preferences</Text>
        <Row label="Language" value="English" onPress={() => { }} />
        <Row label="Theme" value="System" onPress={() => { }} />

        {/* Help & Support */}
        <Text style={s.section}>Help & Support</Text>
        <Row label="FAQ" onPress={() => { }} />
        <Row label="Contact Us" onPress={() => { }} />

        {/* About */}
        <Text style={s.section}>About</Text>
        <Row label="App Version" value="1.2.3" />
        <Row label="Terms of Service" onPress={() => { }} />

      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={s.row} onPress={onPress}>
      <Text style={s.label}>{label}</Text>
      <View style={s.right}>
        {value && <Text style={s.value}>{value}</Text>}
        {onPress && <Ionicons name="chevron-forward" size={18} color="#9A8FBF" />}
      </View>
    </Pressable>
  );
}

function RowSwitch({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D3CCE7', true: PURPLE }}
        thumbColor="#fff"
      />
    </View>
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

  section: {
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1523',
  },

  logoutText: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: '600',
  },

  row: {
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: '#EEE9F7',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { fontSize: 16, fontWeight: '600', color: '#1A1523' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value: { fontSize: 16, color: '#2563EB', fontWeight: '600' },
});
