import { getApp } from '@react-native-firebase/app';
import { initializeAppCheck } from '@react-native-firebase/app-check';
import {
  getAuth,
  signInAnonymously,
  type User,
} from '@react-native-firebase/auth';

let bootstrapPromise: Promise<User> | null = null;

export function bootstrapFirebase(): Promise<User> {
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    await initializeAppCheck(getApp(), {
      provider: {
        providerOptions: {
          android: {
            provider: __DEV__ ? 'debug' : 'playIntegrity',
          },
          apple: {
            provider: __DEV__
              ? 'debug'
              : 'appAttestWithDeviceCheckFallback',
          },
        },
      },
      isTokenAutoRefreshEnabled: true,
    });

    const auth = getAuth();

    if (auth.currentUser) {
      return auth.currentUser;
    }

    const credential = await signInAnonymously(auth);
    return credential.user;
  })();

  return bootstrapPromise;
}
