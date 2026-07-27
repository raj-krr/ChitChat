import { useCallback, useEffect, useState } from "react";
import { soundSynth } from "../utils/audioSynth";

export interface NotificationPayload {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  playSound?: boolean;
  onClick?: () => void;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "denied";
  });

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notifications.");
      return false;
    }

    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      return res === "granted";
    } catch (err) {
      console.error("Error requesting notification permission:", err);
      return false;
    }
  }, []);

  const notify = useCallback(
    (payload: NotificationPayload) => {
      if (!("Notification" in window) || Notification.permission !== "granted") {
        return;
      }

      // Only notify if tab is hidden/backgrounded or forced
      try {
        const notif = new Notification(payload.title, {
          body: payload.body || "",
          icon: payload.icon || "/c2.svg",
          tag: payload.tag || "chitchat-notification",
          renotify: true,
        } as NotificationOptions & { renotify?: boolean });

        if (payload.playSound !== false && payload.tag !== "chitchat-call") {
          soundSynth.playNotificationChime();
        }

        if (payload.onClick) {
          notif.onclick = () => {
            window.focus();
            payload.onClick?.();
            notif.close();
          };
        } else {
          notif.onclick = () => {
            window.focus();
            notif.close();
          };
        }
      } catch (err) {
        console.error("Error displaying notification:", err);
      }
    },
    []
  );

  const playRingtone = useCallback(() => soundSynth.playRingtone(), []);
  const playDialtone = useCallback(() => soundSynth.playDialtone(), []);
  const playChime = useCallback(() => soundSynth.playNotificationChime(), []);
  const stopAudio = useCallback(() => soundSynth.stop(), []);

  return {
    permission,
    requestPermission,
    notify,
    playRingtone,
    playDialtone,
    playChime,
    stopAudio,
    isSupported: typeof window !== "undefined" && "Notification" in window,
  };
}
