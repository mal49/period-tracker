import { useState, useEffect, useCallback, useRef } from "react";

const PUSH_SERVER_URL = import.meta.env.VITE_PUSH_SERVER_URL || "http://localhost:3001";
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

/**
 * Convert a URL-safe base64 string to a Uint8Array (needed for applicationServerKey)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface UseNotificationsReturn {
  permission: NotificationPermission;
  supported: boolean;
  pushSubscription: PushSubscription | null;
  requestPermission: () => Promise<boolean>;
  scheduleNotification: (
    title: string,
    date: Date,
    options?: { body?: string }
  ) => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [supported, setSupported] = useState(true);
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
  const subscriptionRef = useRef<PushSubscription | null>(null);

  // Check support & existing permission/subscription
  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }

    setPermission(Notification.permission);

    // Check for existing push subscription
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((sub) => {
        if (sub) {
          setPushSubscription(sub);
          subscriptionRef.current = sub;
        }
      });
    });
  }, []);

  /**
   * Request notification permission and subscribe to Web Push
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!supported) return false;

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result !== "granted") return false;

    try {
      const registration = await navigator.serviceWorker.ready;

      // Check for existing subscription first
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Create a new push subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
        });
      }

      setPushSubscription(subscription);
      subscriptionRef.current = subscription;
      return true;
    } catch (error) {
      console.error("Failed to subscribe to push:", error);
      return false;
    }
  }, [supported]);

  /**
   * Schedule a push notification via the server.
   * The server will send the push at the specified date/time.
   */
  const scheduleNotification = useCallback(
    async (title: string, date: Date, options?: { body?: string }) => {
      const sub = subscriptionRef.current;
      if (!sub) {
        console.warn("No push subscription — cannot schedule notification");
        return;
      }

      // Don't schedule if the date is in the past
      if (date.getTime() <= Date.now()) return;

      try {
        const response = await fetch(`${PUSH_SERVER_URL}/api/schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: sub.toJSON(),
            notifyAt: date.toISOString(),
            title,
            body: options?.body || "Time to check your cycle!",
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("Failed to schedule notification:", error);
        }
      } catch (error) {
        console.error("Failed to reach push server:", error);
      }
    },
    []
  );

  /**
   * Unsubscribe from push notifications and remove server schedule
   */
  const unsubscribe = useCallback(async () => {
    const sub = subscriptionRef.current;
    if (sub) {
      try {
        // Tell the server to remove our schedule
        await fetch(`${PUSH_SERVER_URL}/api/schedule`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      } catch (error) {
        console.error("Failed to remove server schedule:", error);
      }

      try {
        await sub.unsubscribe();
      } catch (error) {
        console.error("Failed to unsubscribe from push:", error);
      }

      setPushSubscription(null);
      subscriptionRef.current = null;
    }
  }, []);

  return {
    permission,
    supported,
    pushSubscription,
    requestPermission,
    scheduleNotification,
    unsubscribe,
  };
}
