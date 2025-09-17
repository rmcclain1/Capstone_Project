import { View, Text } from 'react-native';
export default function Pantry() {
    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>
            <Text style={{ fontSize: 22, fontWeight: '700' }}>Pantry</Text>
            <Text style={{ marginTop: 8 }}>Items grouped by category.</Text>
        </View>
    );
}
