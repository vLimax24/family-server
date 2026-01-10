export const pushService = {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  async subscribeToPush(personId: number): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/push/vapid-public-key`);
      if (!response.ok) {
        throw new Error(`Failed to get VAPID key: ${response.statusText}`);
      }

      const { publicKey } = await response.json();
      if (!publicKey) {
        throw new Error('No public key received from server');
      }

      const vapidKeyUint8 = urlBase64ToUint8Array(publicKey);
      const applicationServerKey = new Uint8Array(vapidKeyUint8).buffer;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const subscriptionJson = subscription.toJSON();
      const subscribeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person_id: personId,
          endpoint: subscriptionJson.endpoint,
          p256dh: subscriptionJson.keys?.p256dh,
          auth: subscriptionJson.keys?.auth,
        }),
      });

      if (!subscribeResponse.ok) {
        throw new Error(`Failed to subscribe: ${subscribeResponse.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return false;
    }
  },

  async unsubscribe(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return false;

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return false;

      await subscription.unsubscribe();
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  },
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
