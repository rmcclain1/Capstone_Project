// app/scan.tsx (or wherever this route lives)
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/constants/theme_provider";

export default function ScanScreen() {
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const [torchOn, setTorchOn] = useState(false);

  return (
    <SafeAreaView style={s.backdrop}>
      <View style={s.sheet}>
        {/* Header */}
        <View style={s.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            android_ripple={
              Platform.OS === "android" ? { color: theme.border } : undefined
            }
            style={s.iconBtn}
          >
            <Ionicons name="close" size={24} color={theme.text} />
          </Pressable>
          <Text style={s.title}>Scan Barcode</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={s.subtitle}>Position barcode within the frame</Text>

        {/* Scanner frame placeholder */}
        <View style={s.frame} />

        {/* Example detected item row */}
        <View style={s.itemRow}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=150&q=80",
            }}
            style={s.thumb}
          />
          <View style={{ flex: 1 }}>
            <Text style={s.itemTitle}>Organic Apple</Text>
            <Text style={s.itemSub}>Fresh from the orchard</Text>
          </View>
          <TouchableOpacity style={s.addBtn}>
            <Text style={s.addText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={s.actionsRow}>
          <Pressable
            style={[s.actionBtn, torchOn && s.actionBtnActive]}
            onPress={() => setTorchOn(!torchOn)}
            android_ripple={
              Platform.OS === "android" ? { color: theme.border } : undefined
            }
          >
            <Ionicons
              name={torchOn ? "flashlight" : "flashlight-outline"}
              size={18}
              color={theme.text}
              style={{ marginRight: 8 }}
            />
            <Text style={s.actionText}>Flashlight</Text>
          </Pressable>

          <Pressable
            style={s.actionBtn}
            onPress={() => {
              // TODO: Image Picker for barcode from gallery
            }}
            android_ripple={
              Platform.OS === "android" ? { color: theme.border } : undefined
            }
          >
            <Ionicons
              name="image-outline"
              size={18}
              color={theme.text}
              style={{ marginRight: 8 }}
            />
            <Text style={s.actionText}>Upload from Gallery</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const R = 20;

const makeStyles = (t: any) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: t.modalBackdrop, // semi-transparent recommended in your theme
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    sheet: {
      width: "100%",
      backgroundColor: t.card,
      borderRadius: R,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 16,
      shadowColor: "#000",
      shadowOpacity: t.name === "light" ? 0.08 : 0.18,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      ...(Platform.OS === "android" ? { elevation: 6 } : null),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.name === "dark" ? t.border : "transparent",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 4,
      marginBottom: 4,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.inputBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
    },
    title: {
      fontSize: 20,
      fontWeight: "800",
      color: t.text,
    },
    subtitle: {
      textAlign: "center",
      color: t.textDim,
      marginTop: 8,
      marginBottom: 10,
      fontSize: 16,
    },
    frame: {
      height: 180,
      borderRadius: 14,
      backgroundColor: t.primary,
      opacity: 0.15,
      marginHorizontal: 4,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: t.border,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      backgroundColor: t.card,
      marginBottom: 14,
    },
    thumb: {
      width: 44,
      height: 44,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: t.border,
    },
    itemTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: t.text,
    },
    itemSub: {
      fontSize: 14,
      color: t.textDim,
      marginTop: 2,
    },
    addBtn: {
      paddingHorizontal: 16,
      height: 36,
      borderRadius: 10,
      backgroundColor: t.primaryAlt, // a lighter variant of primary in your theme
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      marginLeft: 10,
    },
    addText: {
      color: t.primary,
      fontWeight: "700",
    },
    actionsRow: {
      flexDirection: "row",
      gap: 12,
    },
    actionBtn: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      backgroundColor: t.inputBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    actionBtnActive: {
      backgroundColor: t.primaryAlt,
      borderColor: t.primary,
    },
    actionText: {
      color: t.text,
      fontWeight: "700",
    },
  });
