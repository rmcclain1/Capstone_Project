import React, {useState} from 'react';
import {
    SafeAreaView, 
    KeyboardAvoidingView, 
    Platform,
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity, 
    ActivityIndicator, 
    ScrollView,
    Alert,
} from 'react-native';
import {useAuth} from "@/app/context/auth_context";
import {useRouter} from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const handleLogin = async () => {
        setLoading(true);
        try {
            await login(username, password); // stores token+userId and fetches user
            router.replace('/(tabs)');
        } catch (e: any) {
            Alert.alert('Login Failed', e?.response?.data?.error ?? e?.message ?? 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.select({ios: 'padding', android: undefined})}>
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <View style={{height: 24}}/>

                    <Text style={styles.appName}>Recall App</Text>

                    <View style={{height: 24}}/>

                    <Text style={styles.h2}>Welcome back</Text>
                    <Text style={styles.sub}>Log in to continue</Text>

                    <View style={{height: 16}}/>

                    <TextInput
                        placeholder="Username"
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={username}
                        onChangeText={setUsername}
                        style={styles.input}
                    />
                    <TextInput
                        placeholder="Password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        style={[styles.input, {marginTop: 12}]}
                        autoFocus
                    />
                    {loading ? (
                        <ActivityIndicator size="large" color="#6E56CF"/>
                    ) : (
                        <TouchableOpacity style={styles.cta} onPress={handleLogin}>
                            <Text style={styles.ctaText}>Continue</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.dividerRow}>
                        <View style={styles.divider}/>
                        <Text style={styles.or}>or</Text>
                        <View style={styles.divider}/>
                    </View>

                    <TouchableOpacity style={styles.social} onPress={() => {}}>
                        <Ionicons name="logo-google" size={20} color="#111827" style={{marginRight: 10}}/>
                        <Text style={styles.socialText}>Continue with Google</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.social} disabled>
                        <Ionicons name="logo-apple" size={22} color="#111827" style={{marginRight: 10}}/>
                        <Text style={styles.socialText}>Continue with Apple (dev build)</Text>
                    </TouchableOpacity>

                    <Text style={styles.legal}>
                        By clicking continue, you agree to our <Text style={styles.link}>Terms of Service</Text>{' '}
                        and <Text style={styles.link}>Privacy Policy</Text>
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/signup')} style={{ marginTop: 16 }}>
                        <Text style={styles.signupText}>
                            Don’t have an account? <Text style={styles.signupLink}>Sign up</Text>
                        </Text>
                    </TouchableOpacity>

                    <View style={{height: 32}}/>
                </ScrollView>
            </KeyboardAvoidingView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {flex: 1, backgroundColor: '#fff'},
    container: {paddingHorizontal: 24, paddingTop: 8, alignItems: 'stretch'},
    appName: {fontSize: 32, fontWeight: '800', textAlign: 'center', color: '#111827'},
    h2: {fontSize: 18, fontWeight: '700', textAlign: 'center', color: '#111827'},
    sub: {fontSize: 14, textAlign: 'center', color: '#6B7280', marginTop: 6},
    input: {
        borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: '#111827', marginBottom: 12,
    },
    cta: {
        backgroundColor: '#111827', borderRadius: 12, height: 48,
        alignItems: 'center', justifyContent: 'center', marginTop: 4,
    },
    ctaText: {color: 'white', fontSize: 16, fontWeight: '700'},
    dividerRow: {flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20},
    divider: {flex: 1, height: 1, backgroundColor: '#E5E7EB'},
    or: {color: '#9CA3AF', fontSize: 12},
    social: {
        flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 12,
        backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
        paddingHorizontal: 14, marginBottom: 12,
    },
    socialText: {fontSize: 16, color: '#111827'},
    legal: {textAlign: 'center', color: '#6B7280', fontSize: 12, marginTop: 8, lineHeight: 18},
    link: {color: '#111827', fontWeight: '700', textDecorationLine: 'underline'},
    error: {color: '#b91c1c', textAlign: 'center', marginTop: 8},

    // sheet styles
    sheet: {
        position: 'absolute', left: 0, right: 0, bottom: 0,
        backgroundColor: '#F8F9FB',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        paddingBottom: 24, paddingHorizontal: 16, paddingTop: 8,
    },
    grabberWrap: {alignItems: 'center', paddingVertical: 6},
    grabber: {width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB'},
    sheetTitle: {fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'center', marginTop: 4},
    sheetSub: {fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 6, marginBottom: 8},

    sheetCancelBtn: {
        marginTop: 10, height: 48, borderRadius: 12,
        backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
        alignItems: 'center', justifyContent: 'center',
    },
    sheetCancelText: {color: '#111827', fontSize: 16, fontWeight: '700'},

    signupText: {
        textAlign: 'center',
        fontSize: 14,
        color: '#6B7280', // muted gray, matches your "sub" style
    },
    signupLink: {
        fontWeight: '700',
        color: '#111827', // dark text, same as headings
    },

});
