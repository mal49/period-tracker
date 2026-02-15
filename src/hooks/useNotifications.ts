import { useState, useEffect, useCallback } from "react";

export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [supported, setSupported] = useState(true);

    useEffect(() => {
        if (!('Notification' in window)) {
            setSupported(false);
            return;
        }
        setPermission(Notification.permission);
    }, []);

    const requestPermission = useCallback(async () => {
        if (!supported) return false;

        const result = await Notification.requestPermission();
        setPermission(result);
        return result === 'granted';
    }, [supported]);

    const sendNotification = useCallback((title: string, options?:NotificationOptions) => {
        if (!supported || permission !== 'granted') return;

        try {
            new Notification(title, {
                icon: '/icon-192x192.png',
                badge: '/icon-96x96.png',
                ...options,
            });
        } catch (error) {
            console.error(`Error sending notifications:`, error);
        }
    }, [permission, supported]);

    const scheduleNotification = useCallback((title: string, date: Date, options?:NotificationOptions) => {
        const now = new Date();
        const delay = date.getTime() - now.getTime();

        if (delay > 0 && delay < 86400000 * 30) {
            setTimeout(() => {
                sendNotification(title, options);
            }, delay);
        }
    }, [sendNotification]);

    return {
        permission,
        supported,
        requestPermission,
        sendNotification,
        scheduleNotification
    }
}