import React, {useState, useMemo} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    Image,
    Pressable,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import ScanSheet from "@/components/scan-sheet";
import AddItemModal from "@/components/add-item-modal";

const PURPLE = '#6E56CF';
const BG = '#F5F3FA';

type PantryItem = {
    id: string;
    name: string;
    qty: string;
    image: string;
    expiring?: boolean;
    status?: 'soon' | 'expired' | 'ok';
};

const DATA: PantryItem[] = [
    {
        id: '1',
        name: 'Organic Apples',
        qty: '5 items',
        image:
            'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=200&q=80',
        status: 'ok',
    },
    {
        id: '2',
        name: 'Whole Wheat Bread',
        qty: '1 loaf',
        image:
            'https://images.unsplash.com/photo-1608198093002-ad4e005484b6?w=200&q=80',
        status: 'ok',
    },
    {
        id: '3',
        name: 'Canned Tomatoes',
        qty: '3 cans',
        image:
            'https://images.unsplash.com/photo-1601050690597-c6e9340b2c94?w=200&q=80',
        status: 'ok',
    },
    {
        id: '4',
        name: 'Fresh Spinach',
        qty: '1 bunch',
        image:
            'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=200&q=80',
        status: 'ok',
    },
    {
        id: '5',
        name: 'Almond Milk',
        qty: '2 cartons',
        image:
            'https://images.unsplash.com/photo-1622482873697-7e9c0a1d4fbc?w=200&q=80',
        status: 'ok',
    },
    {
        id: '6',
        name: 'Chicken Breast',
        qty: '1.5 lbs',
        image:
            'https://images.unsplash.com/photo-1604909052947-6fbb7a1e2bcf?w=200&q=80',
        status: 'soon',
        expiring: true,
    },
];

export default function PantryScreen() {
    const [q, setQ] = useState('');
    const [tab, setTab] = useState<'all' | 'soon' | 'expired'>('all');
    const [scanOpen, setScanOpen] = useState(false);
    const [addOpen, setAddOpen] = useState(false);


    const filtered = useMemo(() => {
        let list = DATA;
        if (tab === 'soon') list = DATA.filter(i => i.status === 'soon');
        if (tab === 'expired') list = DATA.filter(i => i.status === 'expired');
        if (q.trim()) {
            const term = q.toLowerCase();
            list = list.filter(i => i.name.toLowerCase().includes(term));
        }
        return list;
    }, [q, tab]);

    return (
        <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
            <View style={s.header}>
                <Pressable onPress={() => setScanOpen(true)
                }>
                    <Ionicons name="qr-code-outline" size={24}
                              color={PURPLE}/>
                </Pressable>
                <Text style={s.headerTitle}>Pantry</Text>
                <Pressable onPress={() => setAddOpen(true)}>
                    <Text style={s.add}>Add</Text>
                </Pressable>
            </View>

            <View style={s.searchWrap}>
                <Ionicons
                    name="search"
                    size={18}
                    color="#7A6A9A"
                    style={{marginRight: 8}}
                />
                <TextInput
                    value={q}
                    onChangeText={setQ}
                    placeholder="Search pantry"
                    placeholderTextColor="#9A8FBF"
                    style={s.searchInput}
                    returnKeyType="search"
                />
            </View>

            <View style={s.tabs}>
                {['all', 'soon', 'expired'].map(key => (
                    <Pressable key={key} onPress={() => setTab(key as any)} style={s.tabBtn}>
                        <Text
                            style={[
                                s.tabText,
                                tab === key && {color: PURPLE, fontWeight: '700'},
                            ]}
                        >
                            {key === 'all'
                                ? 'All'
                                : key === 'soon'
                                    ? 'Expires Soon'
                                    : 'Expired'}
                        </Text>
                        {tab === key && <View style={s.tabIndicator}/>}
                    </Pressable>
                ))}
            </View>

            <FlatList
                data={filtered}
                keyExtractor={it => it.id}
                contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 24}}
                ItemSeparatorComponent={() => <View style={{height: 12}}/>}
                renderItem={({item}) => (
                    <View style={s.row}>
                        <Image source={{uri: item.image}} style={s.thumb}/>
                        <View style={{flex: 1}}>
                            <Text style={s.name}>{item.name}</Text>
                            <Text style={s.qty}>{item.qty}</Text>
                        </View>
                        {item.expiring && (
                            <Ionicons name="warning-outline" size={20} color={PURPLE}/>
                        )}
                    </View>
                )}
            />
            <ScanSheet visible={scanOpen} onClose={() => setScanOpen(false)} />
            <AddItemModal
                visible={addOpen}
                onClose={() => setAddOpen(false)}
                onSubmit={(item) => {
                    // Temporary: just log or add to local list later
                    console.log('NEW ITEM', item);
                }}
            />
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    screen: {flex: 1, backgroundColor: BG},
    header: {
        height: 52,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {fontSize: 18, fontWeight: '800', color: '#1A1523'},
    add: {color: PURPLE, fontWeight: '700', fontSize: 16},

    searchWrap: {
        margin: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEE9F7',
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 12,
    },
    searchInput: {flex: 1, fontSize: 16, color: '#1A1523'},

    tabs: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderBottomColor: '#EEE9F7',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    tabBtn: {alignItems: 'center', paddingVertical: 8, flex: 1},
    tabText: {fontSize: 15, color: '#7A6A9A'},
    tabIndicator: {
        marginTop: 4,
        width: 20,
        height: 3,
        borderRadius: 2,
        backgroundColor: PURPLE,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 12,
        gap: 12,
        // shadow for iOS
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: 3},
        // elevation for Android
        elevation: 1,
    },
    thumb: {width: 48, height: 48, borderRadius: 10, backgroundColor: '#EEE'},
    name: {fontSize: 16, fontWeight: '700', color: '#1A1523'},
    qty: {fontSize: 14, color: PURPLE, fontWeight: '600', marginTop: 2},
});
