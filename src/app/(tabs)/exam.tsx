import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { DuoButton } from '@/components/DuoButton';
import { Screen } from '@/components/Screen';
import { StatsBar } from '@/components/StatsBar';
import { formatDateIt } from '@/lib/date';
import { EXAM_MAX_ERRORS, EXAM_QUESTIONS, EXAM_SECONDS } from '@/lib/quiz';
import { useProgress } from '@/store/progress';
import { F, makeStyles, useColors } from '@/theme';

export default function ExamTab() {
  const C = useColors();
  const styles = useStyles();
  const exams = useProgress(useShallow((s) => s.exams));
  const passed = exams.filter((e) => e.passed).length;
  const last10 = exams.slice(0, 10);
  const readiness = last10.length ? Math.round((last10.filter((e) => e.passed).length / last10.length) * 100) : 0;
  const avgErrors = exams.length ? (exams.reduce((a, e) => a + e.errors, 0) / exams.length).toFixed(1) : '—';

  return (
    <Screen header={<StatsBar left={<Text style={styles.headerTitle}>Esame</Text>} />}>
      <View style={styles.hero}>
        <Text style={{ fontSize: 64 }}>📝</Text>
        <Text style={styles.heroTitle}>Simulazione d’esame</Text>
        <Text style={styles.heroText}>Come all’esame ufficiale della Motorizzazione:</Text>
        <View style={styles.rules}>
          <Rule icon="❓" text={`${EXAM_QUESTIONS} domande Vero/Falso`} />
          <Rule icon="⏱️" text={`${EXAM_SECONDS / 60} minuti di tempo`} />
          <Rule icon="✅" text={`Massimo ${EXAM_MAX_ERRORS} errori per essere idoneo`} />
          <Rule icon="🔀" text="Domande da tutti i 25 argomenti" />
        </View>
        <DuoButton title="Inizia la prova" variant="blue" style={{ alignSelf: 'stretch' }} onPress={() => router.push('/exam-session')} />
      </View>

      <View style={styles.statsRow}>
        <StatBox label="Prove fatte" value={String(exams.length)} />
        <StatBox label="Superate" value={String(passed)} color={C.green} />
        <StatBox label="Media errori" value={avgErrors} color={C.red} />
      </View>

      {exams.length > 0 && (
        <View style={styles.readiness}>
          <Text style={styles.readinessTitle}>Preparazione all’esame</Text>
          <Text style={[styles.readinessValue, { color: readiness >= 80 ? C.green : readiness >= 50 ? C.orange : C.red }]}>
            {readiness}%
          </Text>
          <Text style={styles.readinessHint}>
            {readiness >= 80
              ? 'Sei pronto! Continua ad allenarti per arrivare sicuro all’esame.'
              : 'Basata sulle ultime 10 simulazioni. Punta all’80% di prove superate.'}
          </Text>
        </View>
      )}

      {exams.length > 0 && <Text style={styles.section}>Storico</Text>}
      <View style={{ gap: 10 }}>
        {exams.slice(0, 20).map((e) => (
          <View key={e.id} style={styles.historyRow}>
            <Text style={{ fontSize: 26 }}>{e.passed ? '🎓' : '📚'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.historyTitle, { color: e.passed ? C.greenText : C.redText }]}>
                {e.passed ? 'Idoneo' : 'Non idoneo'} · {e.errors} {e.errors === 1 ? 'errore' : 'errori'}
              </Text>
              <Text style={styles.historyDate}>
                {formatDateIt(e.at)} · {Math.floor(e.seconds / 60)} min {e.seconds % 60} s
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

function Rule({ icon, text }: { icon: string; text: string }) {
  const styles = useStyles();
  return (
    <View style={styles.rule}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text style={styles.ruleText}>{text}</Text>
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  const C = useColors();
  const styles = useStyles();
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color: color ?? C.text }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles((C) => ({
  headerTitle: { fontFamily: F.black, fontSize: 20, color: C.text },
  hero: { marginTop: 16, borderWidth: 2, borderColor: C.grayLight, borderRadius: 20, padding: 20, alignItems: 'center', gap: 8 },
  heroTitle: { fontFamily: F.black, fontSize: 24, color: C.text },
  heroText: { fontFamily: F.regular, fontSize: 15, color: C.textLight },
  rules: { alignSelf: 'stretch', gap: 8, marginVertical: 10 },
  rule: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  ruleText: { fontFamily: F.bold, color: C.text, fontSize: 15 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statBox: { flex: 1, borderWidth: 2, borderColor: C.grayLight, borderRadius: 16, padding: 12, alignItems: 'center' },
  statValue: { fontFamily: F.black, fontSize: 24 },
  statLabel: { fontFamily: F.bold, fontSize: 12, color: C.gray },
  readiness: { marginTop: 16, borderWidth: 2, borderColor: C.grayLight, borderRadius: 16, padding: 16, alignItems: 'center' },
  readinessTitle: { fontFamily: F.bold, color: C.text, fontSize: 16 },
  readinessValue: { fontFamily: F.black, fontSize: 44 },
  readinessHint: { fontFamily: F.regular, color: C.textLight, fontSize: 14, textAlign: 'center' },
  section: { fontFamily: F.black, fontSize: 21, color: C.text, marginTop: 22, marginBottom: 10 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderColor: C.grayLight, borderRadius: 16, padding: 12 },
  historyTitle: { fontFamily: F.bold, fontSize: 16 },
  historyDate: { fontFamily: F.regular, color: C.gray, fontSize: 13 },
}));
