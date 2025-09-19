import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function RecallDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>
            <Text style={{ fontSize: 22, fontWeight: '700' }}>Recall Detail</Text>
            <Text style={{ marginTop: 8 }}>ID: {id}</Text>
        </View>
    );
}
