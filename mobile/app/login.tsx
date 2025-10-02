import {useRouter} from 'expo-router';
import React, {useState} from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import {useAuth} from "@/app/context/auth_context";

export default function Login() {
    const router = useRouter();
    const {login} = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            await login(username, password); // stores token+userId and fetches user
            router.replace('/(tabs)');       // go to your tabs root
        } catch (e: any) {
            Alert.alert('Login Failed', e?.response?.data?.error ?? e?.message ?? 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login to Your Pantry</Text>
            <TextInput
                style={styles.input}
                placeholder="Username"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                autoCapitalize="none"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            {loading ? (
                <ActivityIndicator size="large" color="#6E56CF"/>
            ) : (
                <Button title="Login" onPress={handleLogin} color="#6E56CF"/>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        backgroundColor: '#F5F3FA',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 32,
        textAlign: 'center',
        color: '#1A1523',
    },
    input: {
        height: 48,
        borderColor: '#DDD',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 16,
        marginBottom: 16,
        backgroundColor: '#FFF',
    },
});
