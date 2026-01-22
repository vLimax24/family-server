const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const pushService = {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  async subscribeToPush(personId: number): Promise<boolean> {
    try {
      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/push/vapid-public-key`);
      const { publicKey } = await response.json();
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Check if there's an existing subscription
      let subscription = await registration.pushManager.getSubscription();

      // If subscription exists, check if it uses the same key
      if (subscription) {
        try {
          // Try to get the key from the existing subscription
          const existingKey = subscription.options.applicationServerKey;

          if (existingKey) {
            const existingKeyArray = new Uint8Array(existingKey as ArrayBuffer);

            // Compare keys
            const keysMatch =
              existingKeyArray.length === applicationServerKey.length &&
              existingKeyArray.every((byte, i) => byte === applicationServerKey[i]);

            if (!keysMatch) {
              console.log('VAPID key changed, unsubscribing from old subscription...');
              await subscription.unsubscribe();
              subscription = null;
            } else {
              console.log('Using existing subscription with matching key');
            }
          } else {
            // No key in existing subscription, unsubscribe to be safe
            console.log('Existing subscription has no key, unsubscribing...');
            await subscription.unsubscribe();
            subscription = null;
          }
        } catch (error) {
          console.warn('Could not compare keys, unsubscribing to be safe:', error);
          await subscription?.unsubscribe();
          subscription = null;
        }
      }

      // Subscribe or resubscribe
      if (!subscription) {
        console.log('Creating new push subscription...');
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.buffer as ArrayBuffer, // Fix: Use .buffer property
        });
      }

      // Send subscription to backend
      const subscriptionData = subscription.toJSON();
      const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          person_id: personId,
          endpoint: subscriptionData.endpoint,
          p256dh: subscriptionData.keys?.p256dh,
          auth: subscriptionData.keys?.auth,
        }),
      });

      if (!backendResponse.ok) {
        throw new Error('Failed to save subscription to backend');
      }

      console.log('✓ Push subscription successful');
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  },

  async unsubscribe(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        console.log('✓ Unsubscribed from push notifications');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  },
};
