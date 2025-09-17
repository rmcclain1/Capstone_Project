import { View, Text } from 'react-native';
import { Link } from 'expo-router';
export default function Profile() {
    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>
            <Text style={{ fontSize: 22, fontWeight: '700' }}>Profile</Text>
            <Link href="/notifications" style={{ color: '#0E7AFE', marginTop: 8 }}>Notifications</Link>
            <Link href="/settings" style={{ color: '#0E7AFE', marginTop: 8 }}>Settings</Link>
            <Link href="/organization" style={{ color: '#0E7AFE', marginTop: 8 }}>Organization</Link>
            <Link href="/ai" style={{ color: '#0E7AFE', marginTop: 8 }}>Ask AI</Link>
        </View>
    );
}
