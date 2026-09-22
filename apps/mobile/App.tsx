import { useState } from 'react';
import { StatusBar } from 'react-native';

import { ActivityScreen } from './src/screens/ActivityScreen';
import { LiveMapScreen } from './src/screens/LiveMapScreen';
import type { ActivityKind } from './src/features/activity/session/ActivitySessionMachine';

type AppRoute =
  | { name: 'home' }
  | { name: 'activity'; activityType: ActivityKind };

export default function App() {
  const [route, setRoute] = useState<AppRoute>({ name: 'home' });

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
          onDone={() => setRoute({ name: 'home' })}
        />
      )}
    </>
  );
}
