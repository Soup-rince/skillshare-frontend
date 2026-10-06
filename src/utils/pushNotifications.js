import { getVapidPublicKey, subscribePush } from "../api";

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        console.log("Service Worker not supported");
        return null;
    }
    try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        return registration;
    } catch (err) {
        console.error("SW registration failed:", err);
        return null;
    }
}

export async function requestPushPermission(token) {
    if (!("Notification" in window) || !("PushManager" in window)) {
        throw new Error("Push notifications not supported in this browser");
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        throw new Error("Permission denied");
    }

    const registration = await navigator.serviceWorker.ready;
    const vapidRes = await getVapidPublicKey();
    const vapidPublicKey = vapidRes.data.publicKey;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
    }

    await subscribePush(subscription, token);
    return subscription;
}

export async function getPushPermissionStatus() {
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
}