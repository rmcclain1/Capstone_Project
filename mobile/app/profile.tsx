import React, {useState} from "react";
import {SafeAreaView} from 'react-native-safe-area-context';
import {View, Text, StyleSheet, Image, Pressable, ScrollView} from 'react-native';
import {useRouter} from 'expo-router';
import EditProfileModal from "@/components/edit-profile-modal";

const PURPLE = '#6E56CF';

export default function Profile() {
    const router = useRouter();
    const [editOpen, setEditOpen] = useState(false);

    return (
        <SafeAreaView style={s.screen} edges={['top']}>
            <View style={s.header}>
                <Pressable onPress={() => router.back()}>
                    <Text style={s.back}>{'‹'}</Text>
                </Pressable>
                <Text style={s.headerTitle}>Profile</Text>
                <View style={{width: 30}}/>
            </View>

            <ScrollView contentContainerStyle={{paddingBottom: 40}}>
                <View style={s.center}>
                    <Image
                        source={{uri: 'https://i.pravatar.cc/200?img=5'}}
                        style={s.avatar}
                    />
                    <Text style={s.name}>Jane Doe</Text>
                    <Text style={s.username}>@jane.doe</Text>

                    <Pressable onPress={() => setEditOpen(true)} style={s.editBtn}>
                        <Text style={s.editBtnText}>Edit Profile</Text>
                    </Pressable>
                </View>

                <Text style={s.sectionTitle}>Personal Information</Text>
                <InfoRow label="Email" value="jane.doe@email.com"/>
                <InfoRow label="Phone Number" value="+1 (555) 123-4567"/>
                <InfoRow label="Birthday" value="May 20, 1985"/>
                <InfoRow label="Location" value="New York, NY"/>

                <Text style={s.sectionTitle}>Allergies</Text>
                <Text style={s.allergy}>Peanuts</Text>
                <Text style={s.allergy}>Dairy</Text>
            </ScrollView>
            <EditProfileModal
                visible={editOpen}
                onClose={() => setEditOpen(false)}
                onSave={(payload) => {
                    console.log('SAVE PROFILE -> ', payload);
                }}
            />
        </SafeAreaView>
    );
}

function InfoRow({label, value}: { label: string; value: string }) {
    return (
        <View style={{marginBottom: 30}}>
            <Text style={s.infoLabel}>{label}</Text>
            <Text style={s.infoValue}>{value}</Text>
        </View>
    );
}

const s = StyleSheet.create({
    screen: {flex: 1, backgroundColor: '#fff'},
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 56,
    },
    back: {fontSize: 28, color: '#333'},
    headerTitle: {fontSize: 18, fontWeight: '700', color: '#111'},

    center: {alignItems: 'center', marginTop: 12},
    avatar: {width: 100, height: 100, borderRadius: 50, backgroundColor: '#ddd'},
    name: {marginTop: 12, fontSize: 22, fontWeight: '800', color: '#111'},
    username: {marginTop: 4, fontSize: 16, color: PURPLE},

    editBtn: {
        marginTop: 16,
        backgroundColor: '#F3F0FF',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 10,
    },
    editBtnText: {color: '#111', fontWeight: '600', width: '100%'},

    sectionTitle: {
        marginTop: 24,
        marginBottom: 24,
        paddingHorizontal: 16,
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
    },
    infoLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginHorizontal: 16,
    },
    infoValue: {
        fontSize: 15,
        color: PURPLE,
        marginHorizontal: 16,
    },
    allergy: {
        fontSize: 15,
        color: '#333',
        marginHorizontal: 16,
        marginBottom: 24,
    },
});
