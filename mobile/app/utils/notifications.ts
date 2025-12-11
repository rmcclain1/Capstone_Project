// app/utils/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
    let token: string | null = null;

    // Skip push notifications on web platform
    if (Platform.OS === 'web') {
        console.log('[Notifications] Push notifications not supported on web');
        return null;
    }

    // On simulators/emulators (Expo Go), we can still get a token for testing
    if (!Device.isDevice) {
        console.log('[Notifications] Running on simulator/emulator - push notifications may not work but will attempt registration');
    }

    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            console.log('[Notifications] Requesting permissions...');
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Notifications] Permission denied');
            return null;
        }

        console.log('[Notifications] Permission granted, getting token...');

        // Get Expo push token - works in Expo Go and emulators for testing
        const tokenData = await Notifications.getExpoPushTokenAsync();
        token = tokenData.data;
        console.log('[Notifications] Expo push token:', token);

        if (Platform.OS === 'android') {
            console.log('[Notifications] Setting up Android notification channel...');
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return token;
    } catch (error) {
        console.error('[Notifications] Error registering for push notifications:', error);
        return null;
    }
}
