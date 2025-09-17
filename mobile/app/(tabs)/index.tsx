import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();
  return (
    <View style={s.container}>
      <Text style={s.h1}>Home</Text>
      <Pressable style={s.btn} onPress={() => router.push('/(tabs)/scan')}>
        <Text style={s.btnText}>Scan</Text>
      </Pressable>
      <Pressable style={s.btn} onPress={() => router.push('/pantry')}>
        <Text style={s.btnText}>Pantry</Text>
      </Pressable>
      <Link href="/recalls" style={s.link}>Go to Recalls</Link>
      <Link href="/notifications" style={s.link}>Notifications</Link>
      <Link href="/settings" style={s.link}>Settings</Link>
      <Link href="/organization" style={s.link}>Organization</Link>
      <Link href="/ai" style={s.link}>Ask AI</Link>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  h1: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  btn: { backgroundColor: '#0E7AFE', padding: 12, borderRadius: 10, marginBottom: 8 },
  btnText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  link: { color: '#0E7AFE', marginTop: 8 },
});
