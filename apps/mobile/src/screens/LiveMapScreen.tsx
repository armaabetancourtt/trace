import { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ActivityTypeSelector } from '../components/ActivityTypeSelector';
import { TraceButton } from '../components/TraceButton';
import { TraceMap } from '../components/TraceMap';
import { TraceWordmark } from '../components/TraceWordmark';
import type { ActivityKind } from '../features/activity/session/ActivitySessionMachine';
import { colors } from '../theme/tokens';

export function LiveMapScreen({
  onStart,
}: {
  onStart: (activityType: ActivityKind) => void;
}) {
  const [activityType, setActivityType] = useState<ActivityKind>('run');

  return (
    <View style={styles.root}>
      <TraceMap />

      <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.topBar}>
          <View>
            <TraceWordmark width={152} />
            <Text style={styles.network}>LIVE MOVEMENT NETWORK</Text>
          </View>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLabel}>LIVE</Text>
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.panel}>
          <Text style={styles.eyebrow}>MOVE WITH THE CITY</Text>
          <Text style={styles.question}>Where do you want to move?</Text>

          <ActivityTypeSelector
            value={activityType}
            onChange={setActivityType}
          />

          <View style={styles.actions}>
            <TraceButton onPress={() => onStart(activityType)}>
              START
            </TraceButton>
            <TraceButton tone="secondary" disabled>
              FIND PEOPLE · SOON
            </TraceButton>
          </View>

          <Text style={styles.privacy}>
            Live discovery is opt-in. Precise location is never public by
            default.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 20,
  },
  topBar: {
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  network: {
    marginTop: 4,
    color: colors.softGray,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.7,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#383838',
    borderRadius: 99,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: 'rgba(5,5,5,0.72)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: colors.live,
  },
  liveLabel: {
    color: colors.offWhite,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  spacer: {
    flex: 1,
  },
  panel: {
    marginBottom: 12,
    padding: 20,
    backgroundColor: 'rgba(5,5,5,0.96)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    borderRadius: 12,
  },
  eyebrow: {
    color: colors.offWhite,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  question: {
    marginTop: 9,
    marginBottom: 22,
    color: colors.offWhite,
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -1.1,
  },
  actions: {
    gap: 10,
    marginTop: 20,
  },
  privacy: {
    marginTop: 16,
    color: colors.softGray,
    fontSize: 11,
    lineHeight: 16,
  },
});
