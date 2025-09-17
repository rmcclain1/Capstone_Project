import { View, Text } from 'react-native';
import { Link } from 'expo-router';
export default function Recalls() {
    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>
            <Text style={{ fontSize: 22, fontWeight: '700' }}>Recalls</Text>
            <Link href="/recall/123" style={{ color: '#0E7AFE', marginTop: 12 }}>Open Recall Detail</Link>
        </View>
    );
}
