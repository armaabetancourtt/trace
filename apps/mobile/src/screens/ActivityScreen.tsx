import { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TraceButton } from '../components/TraceButton';
import { TraceMap } from '../components/TraceMap';
import type { ActivityKind } from '../features/activity/session/ActivitySessionMachine';
import { useActivitySession } from '../features/activity/hooks/useActivitySession';
import { colors } from '../theme/tokens';

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const remaining = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(
    2,
    '0',
  )}`;
}

function formatPace(secondsPerKm: number | null) {
  if (!secondsPerKm || !Number.isFinite(secondsPerKm)) return '—';

  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function ActivityScreen({
  activityType,
  onDone,
}: {
  activityType: ActivityKind;
  onDone: () => void;
}) {
  const {
    session,
    metrics,
    route,
    error,
    start,
    pause,
    resume,
    finish,
  } = useActivitySession(activityType);

  const [starting, setStarting] = useState(true);

  useEffect(() => {
    void start().finally(() => setStarting(false));
  }, [start]);

  useEffect(() => {
    if (error) Alert.alert('TRACE', error);
  }, [error]);

  async function handleFinish() {
    const completed = await finish();
    if (completed) onDone();
  }

  const paused = session.phase === 'paused';

  return (
    <View style={styles.root}>
      <TraceMap route={route} />

      <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.top}>
          <Text style={styles.mode}>
            {activityType.toUpperCase()} · {paused ? 'PAUSED' : 'RECORDING'}
          </Text>

          <View style={styles.metrics}>
            <View>
              <Text style={styles.value}>
                {(metrics.distanceM / 1000).toFixed(2)}
              </Text>
              <Text style={styles.unit}>KM</Text>
            </View>
            <View>
              <Text style={styles.value}>
                {formatPace(metrics.averagePaceSecPerKm)}
              </Text>
              <Text style={styles.unit}>/KM</Text>
            </View>
            <View>
              <Text style={styles.value}>
                {formatDuration(metrics.durationSec)}
              </Text>
              <Text style={styles.unit}>TIME</Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.controls}>
          {starting ? (
            <Text style={styles.starting}>PREPARING GPS…</Text>
          ) : (
            <>
              <TraceButton onPress={paused ? resume : pause}>
                {paused ? 'RESUME' : 'PAUSE'}
              </TraceButton>
              <TraceButton tone="secondary" onPress={handleFinish}>
                FINISH
              </TraceButton>
            </>
          )}
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
  top: {
    paddingTop: 14,
  },
  mode: {
    alignSelf: 'center',
    color: colors.live,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.9,
  },
  metrics: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(5,5,5,0.92)',
    borderColor: '#272727',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  value: {
    color: colors.offWhite,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  unit: {
    marginTop: 3,
    color: colors.softGray,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  spacer: {
    flex: 1,
  },
  controls: {
    gap: 10,
    marginBottom: 12,
  },
  starting: {
    alignSelf: 'center',
    marginBottom: 24,
    color: colors.offWhite,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
});
