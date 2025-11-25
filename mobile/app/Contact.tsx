import { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context"; // Ensures UI elements are displayed within safe boundaries.
import { useRouter } from "expo-router"; // for handling screen-to-screen navigation
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { useTheme } from "@/constants/theme_provider"; // 'useTheme' is used to re-render components with updated color palettes.

/**
 * The functional screen that renders the screen for contacting developers
 * @returns the screen that renders the 'Contact Us' page
 */
export default function Contact() {
  // screen navigation
  const router = useRouter();

  // screen visuals
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const recipientEmail = "ericcx00@gmail.com";
  const emailSubject = "Customer Inquiry";
  const emailBody = "Hello, I had a question about...";

  const handleEmailPress = async () => {
    const url = `mailto:${recipientEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "No email app found on your device.");
      }
    } catch (error) {
      console.error("An error occurred:", error);
      Alert.alert("Error", "Failed to open email app.");
    }
  };

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Text style={s.back}>{"‹"}</Text>
        </Pressable>
        <Text style={s.headerTitle}>Contact Us</Text>
        <View style={{ width: 30 }} />
      </View>

      <View>
        {/* Body Paragraph */}
        <Text style={s.paragraph}>
          Hello! We’re a small development team, responding to everyone may take
          a while. For any questions or complaints regarding our application,
          Please contact us and we’ll get back to you as soon as possible.
        </Text>

        <Text style={s.thank_you_message}>
          ❤️ Thank you for supporting us. ❤️
        </Text>
      </View>

      <TouchableOpacity style={s.button} onPress={handleEmailPress}>
        <Text style={s.buttonText}>{"Send message"}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ---------------- Styles ---------------- */

const makeStyles = (t: any) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: t.bg,
    },

    header: {
      height: 52,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    headerTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: t.text,
    },

    paragraph: {
      fontSize: 14,
      textAlign: "center",
      color: t.text,
      marginTop: 2,
      marginBottom: 12,
      marginHorizontal: 10,
    },

    thank_you_message: {
      fontSize: 14,
      textAlign: "center",
      color: t.text,
      marginTop: 2,
      marginBottom: 12,
      marginHorizontal: 10,
      fontWeight: "bold",
    },

    section: {
      marginTop: 2,
      marginBottom: 8,
      paddingHorizontal: 16,
      fontSize: 14,
      fontWeight: "600",
      color: t.text,
    },

    row: {
      paddingHorizontal: 16,
      height: 52,
      backgroundColor: t.card,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomColor: t.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },

    label: {
      fontSize: 16,
      fontWeight: "600",
      color: t.text,
    },

    right: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    value: {
      fontSize: 16,
      color: t.primary,
      fontWeight: "600",
    },

    group: {
      marginHorizontal: 16,
      marginTop: 8,
      backgroundColor: t.card,
      borderRadius: 12,
      padding: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
    },

    groupLabel: {
      color: t.text,
      fontWeight: "800",
      marginBottom: 10,
    },

    segmentWrap: {
      flexDirection: "row",
      borderRadius: 10,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      backgroundColor: t.bg,
    },

    segmentBtn: {
      flex: 1,
      height: 40,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: t.border,
    },

    segmentLeft: {
      borderTopLeftRadius: 10,
      borderBottomLeftRadius: 10,
    },

    segmentRight: {
      borderTopRightRadius: 10,
      borderBottomRightRadius: 10,
      borderRightWidth: 0,
    },

    segmentText: {
      color: t.textDim,
      fontWeight: "700",
    },

    back: {
      fontSize: 28,
      color: t.text,
    },

    sectionTitle: {
      marginTop: 24,
      marginBottom: 4,
      paddingHorizontal: 16,
      fontSize: 28,
      fontWeight: "900",
      color: t.text,
    },

    input: {
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.inputBg,
      paddingHorizontal: 14,
      color: t.text,
      marginBottom: 10,
      marginHorizontal: 25,
    },

    button: {
      position: "absolute",
      bottom: 35,
      left: 0,
      right: 0,
      backgroundColor: "#2563EB",
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 30,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 32,
      marginTop: 8,
      minWidth: 180,
    },

    buttonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
    },
  });
