import { View, Text } from 'react-native';
import { Link } from 'expo-router';
export default function Scan() {
    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>
            <Text style={{ fontSize: 22, fontWeight: '700' }}>Scan</Text>
            <Text style={{ marginTop: 8 }}>Scanner placeholder.</Text>
            <Link href="/(tabs)/manual-entry" style={{ color: '#0E7AFE', marginTop: 12 }}>Manual Entry</Link>
        </View>
    );
}
