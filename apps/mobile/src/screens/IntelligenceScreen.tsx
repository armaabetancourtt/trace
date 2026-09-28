import { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TraceButton } from '../components/TraceButton';
import { TraceWordmark } from '../components/TraceWordmark';
import { colors } from '../theme/tokens';

type Insight = {
  activityId: string;
  status: 'ready' | 'insufficient_history';
  modelKind: 'prior_28d_pace_baseline';
  trainedModelDeployed: false;
  summary: string;
  prediction: {
    expectedPaceSecPerKm: number | null;
    actualPaceSecPerKm: number | null;
    deltaSecPerKm: number | null;
    historyCount: number;
    windowDays: 28;
  };
  evidence: Array<{ id: string; text: string }>;
  limitations: string[];
};
type Generated = {
  status: string;
  generated: null | { text: string; sourceId: string; quote: string };
  limitation?: string;
};

function readableError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'TRACE Intelligence is unavailable.';
}

export function IntelligenceScreen({ onBack }: { onBack: () => void }) {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let mounted = true;
    const callable = httpsCallable<{ activityId?: string }, Insight>(
      getFunctions(), 'getActivityInsight',
    );
    void callable({}).then((response) => {
      if (mounted) setInsight(response.data);
    }).catch((cause: unknown) => {
      if (mounted) setError(readableError(cause));
    }).finally(() => {
      if (mounted) setBusy(false);
    });
    return () => { mounted = false; };
  }, []);

  async function generate() {
    if (!insight || generating || insight.status !== 'ready') return;
    setGenerating(true);
    setError(null);
    try {
      // The user explicitly opts in by pressing this control. Cloud Functions
      // re-fetches their own summaries; the mobile client sends no metrics/GPS.
      const callable = httpsCallable<{ activityId: string; consent: boolean }, Generated>(
        getFunctions(), 'generateActivityInsight',
      );
      const response = await callable({ activityId: insight.activityId, consent: true });
      setGenerated(response.data);
    } catch (cause) {
      setError(readableError(cause));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TraceWordmark width={128} />
          <Text style={styles.eyebrow}>MOVEMENT INTELLIGENCE / BETA</Text>
        </View>
        <Text style={styles.headline}>Understand your run.</Text>
        <Text style={styles.meta}>Private activity summaries only. No raw route is processed by AI.</Text>

        {busy ? <Text style={styles.meta}>LOADING YOUR LAST SYNCED RUN…</Text> : null}
        {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
        {insight ? (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>{insight.status === 'ready' ? 'PACE COMPARISON' : 'HISTORY REQUIRED'}</Text>
              <Text style={styles.summary}>{insight.summary}</Text>
              <Text style={styles.meta}>
                Model: {insight.modelKind.replaceAll('_', ' ')} · {insight.prediction.historyCount} earlier runs
              </Text>
            </View>
            <Text style={styles.label}>AUDITABLE EVIDENCE</Text>
            {insight.evidence.map((fact) => (
              <View style={styles.fact} key={fact.id}>
                <Text style={styles.factId}>{fact.id.toUpperCase()}</Text>
                <Text style={styles.factText}>{fact.text}</Text>
              </View>
            ))}
            {insight.status === 'ready' ? (
              <>
                <TraceButton disabled={generating} onPress={() => void generate()}>
                  {generating ? 'GENERATING…' : 'OPT IN · GENERATE EXPLANATION'}
                </TraceButton>
                <Text style={styles.meta}>
                  Optional external AI receives only aggregated pace and count facts. No GPS,
                  route, account ID, or activity timestamps are sent.
                </Text>
              </>
            ) : null}
            {generated?.generated ? (
              <View style={styles.card}>
                <Text style={styles.label}>OPTIONAL GENERATIVE INTERPRETATION</Text>
                <Text style={styles.summary}>{generated.generated.text}</Text>
                <Text style={styles.meta}>
                  Source: {generated.generated.sourceId} · “{generated.generated.quote}”
                </Text>
                <Text style={styles.meta}>{generated.limitation}</Text>
              </View>
            ) : null}
            <Text style={styles.meta}>{insight.limitations.join(' ')}</Text>
          </>
        ) : null}
        <TraceButton tone="secondary" onPress={onBack}>BACK TO MAP</TraceButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  content: { padding: 22, paddingBottom: 48, gap: 16 },
  header: { marginTop: 10, gap: 8 },
  eyebrow: { color: colors.live, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  headline: { color: colors.offWhite, fontSize: 36, lineHeight: 40, fontWeight: '800' },
  label: { color: colors.live, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  meta: { color: colors.softGray, fontSize: 12, lineHeight: 19 },
  error: { color: '#FF9C8F', fontSize: 13 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 20, gap: 12, borderWidth: 1, borderColor: colors.line },
  summary: { color: colors.offWhite, fontSize: 19, fontWeight: '600', lineHeight: 26 },
  fact: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 9, gap: 6 },
  factId: { color: colors.softGray, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  factText: { color: colors.offWhite, fontSize: 14, lineHeight: 20 },
});
