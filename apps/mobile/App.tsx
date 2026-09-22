import { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ActivityScreen } from './src/screens/ActivityScreen';
import { LiveMapScreen } from './src/screens/LiveMapScreen';
import type { ActivityKind } from './src/features/activity/session/ActivitySessionMachine';
import { bootstrapFirebase } from './src/services/FirebaseBootstrap';
import { syncAllPendingActivities } from './src/features/sync/syncPendingActivities';
import { colors } from './src/theme/tokens';

type AppRoute =
  | { name: 'home' }
  | { name: 'activity'; activityType: ActivityKind };

export default function App() {
  const [route, setRoute] = useState<AppRoute>({ name: 'home' });
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  useEffect(() => {
    void bootstrapFirebase()
      .then(() => syncAllPendingActivities())
      .catch((cause) => {
        setBootstrapError(
          cause instanceof Error
            ? cause.message
            : 'Firebase bootstrap failed',
        );
      });
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" />

      {route.name === 'home' ? (
        <LiveMapScreen
          onStart={(activityType) =>
            setRoute({ name: 'activity', activityType })
          }
        />
      ) : (
        <ActivityScreen
          activityType={route.activityType}
          onDone={() => {
            setRoute({ name: 'home' });
            void syncAllPendingActivities();
          }}
        />
      )}

      {bootstrapError ? (
        <View style={styles.warning}>
          <Text style={styles.warningTitle}>LOCAL MODE</Text>
          <Text style={styles.warningText}>
            Firebase is not configured yet. Activity recording still works
            offline and will remain queued for sync.
          </Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  warning: {
    position: 'absolute',
    top: 56,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#3B3B3B',
    backgroundColor: 'rgba(5,5,5,0.94)',
  },
  warningTitle: {
    color: colors.live,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  warningText: {
    marginTop: 5,
    color: colors.softGray,
    fontSize: 11,
    lineHeight: 15,
  },
});
