import React, { useEffect, useState } from 'react';
import {View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function RecallDetails() {
  const params = useLocalSearchParams() as any;

  const [recall, setRecall] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecall() {
      try {
        const res = await fetch(`http://localhost:3000/api/v1/food_events/${params.id}`);
        const data = await res.json();
        setRecall(data);
      } catch (error) {
        console.error('Error fetching recall details:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecall();
  }, [params.id]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2362ff" />
      </SafeAreaView>
    );
  }

  if (!recall) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Recall not found.</Text>
      </SafeAreaView>
    );
  }

  // get the fields
  const {
    product_description,
    recalling_firm,
    reason_for_recall,
    code_info,
    report_date,
    classification,
    product_type,
  } = recall;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Recall Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.product}>{product_description}</Text>

        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1585238342023-78df9f2601e4?w=400&q=80',
          }}
          style={styles.hero}
        />

        <Text style={styles.h2}>Reason for Recall</Text>
        <Text style={styles.body}>{reason_for_recall || 'Not provided.'}</Text>

        <View style={styles.card}>
          <Row label="Manufacturer" value={recalling_firm || '—'} />
          <Divider />
          <Row label="Product Type" value={product_type || '—'} />
          <Divider />
          <Row label="Classification" value={classification || '—'} />
          <Divider />
          <Row label="Report Date" value={report_date || '—'} />
          <Divider />
          <Row label="Code Info" value={code_info || '—'} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <View style={rowStyles.row}>
            <Text style={rowStyles.label}>{label}</Text>
            <Text style={rowStyles.value}>{value}</Text>
        </View>
    );
}
function Divider() {
    return <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />;
}

const styles = StyleSheet.create({
    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 10, paddingVertical: 10,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F4F6',
        alignItems: 'center', justifyContent: 'center',
    },
    topTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },

    product: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
    hero: {
        width: '100%', height: 170, borderRadius: 14, marginBottom: 14,
        backgroundColor: '#E5E7EB',
    },
    h2: { fontWeight: '800', color: '#111827', marginTop: 6, marginBottom: 6 },
    body: { color: '#374151', lineHeight: 20 },

    card: {
        marginTop: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFF',
        paddingHorizontal: 12, paddingTop: 6, paddingBottom: 6,
    },
});

const rowStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    label: { width: 140, color: '#6B7280', fontWeight: '600', fontSize: 13 },
    value: { flex: 1, color: '#111827', fontSize: 13 },
});
