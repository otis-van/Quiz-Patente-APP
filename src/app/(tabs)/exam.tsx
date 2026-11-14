import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { IconName, PixelIcon } from '@/components/PixelIcon';
import { RetroButton } from '@/components/RetroButton';
import { Screen } from '@/components/Screen';
import { StatsBar } from '@/components/StatsBar';
import { Window } from '@/components/Window';
import { formatDateIt } from '@/lib/date';
import { EXAM_MAX_ERRORS, EXAM_QUESTIONS, EXAM_SECONDS } from '@/lib/quiz';
import { useProgress } from '@/store/progress';
import { boxed, F, makeStyles, useColors } from '@/theme';

export default function ExamTab() {
  const C = useColors();
  const styles = useStyles();
  const exams = useProgress(useShallow((s) => s.exams));
  const passed = exams.filter((e) => e.passed).length;
  const last10 = exams.slice(0, 10);
  const readiness = last10.length ? Math.round((last10.filter((e) => e.passed).length / last10.length) * 100) : 0;
  const avgErrors = exams.length ? (exams.reduce((a, e) => a + e.errors, 0) / exams.length).toFixed(1) : '—';

  return (
    <Screen header={<StatsBar left={<Text style={styles.headerTitle}>ESAME</Text>} />}>
      <Window title="simulazione_esame.exe" color={C.blue} style={{ marginTop: 20 }} bodyStyle={styles.hero}>
        <PixelIcon name="doc" size={64} />
        <Text style={styles.heroTitle}>Simulazione d’esame</Text>
        <Text style={styles.heroText}>Come all’esame ufficiale della Motorizzazione:</Text>
        <View style={styles.rules}>
          <Rule icon="question" text={`${EXAM_QUESTIONS} domande Vero/Falso`} />
          <Rule icon="clock" text={`${EXAM_SECONDS / 60} minuti di tempo`} />
          <Rule icon="check" text={`Massimo ${EXAM_MAX_ERRORS} errori per essere idoneo`} />
          <Rule icon="sparkle" text="Domande da tutti i 25 argomenti" />
        </View>
        <RetroButton
          title="Inizia la prova"
          variant="yellow"
          style={{ alignSelf: 'stretch' }}
          onPress={() => router.push('/exam-session')}
        />
      </Window>

      <View style={styles.statsRow}>
        <StatBox label="Prove fatte" value={String(exams.length)} color={C.lilac} />
        <StatBox label="Superate" value={String(passed)} color={C.green} />
        <StatBox label="Media errori" value={avgErrors} color={C.pink} />
      </View>

      {exams.length > 0 && (
        <Window title="preparazione.sys" color={C.mint} style={{ marginTop: 18 }} bodyStyle={{ alignItems: 'center' }}>
          <Text style={[styles.readinessValue, { color: readiness >= 80 ? C.greenText : readiness >= 50 ? C.text : C.redText }]}>
            {readiness}%
          </Text>
          <Text style={styles.readinessHint}>
            {readiness >= 80
              ? 'Sei pronto! Continua ad allenarti per arrivare sicuro all’esame.'
              : 'Basata sulle ultime 10 simulazioni. Punta all’80% di prove superate.'}
          </Text>
        </Window>
      )}

      {exams.length > 0 && <Text style={styles.section}>Storico</Text>}
      <View style={{ gap: 12 }}>
        {exams.slice(0, 20).map((e) => (
          <View key={e.id} style={styles.historyRow}>
            <View style={[styles.historyBadge, { backgroundColor: e.passed ? C.green : C.pink }]}>
              <PixelIcon name={e.passed ? 'cap' : 'book'} size={26} />
            </View>
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

function Rule({ icon, text }: { icon: IconName; text: string }) {
  const styles = useStyles();
  return (
    <View style={styles.rule}>
      <PixelIcon name={icon} size={20} />
      <Text style={styles.ruleText}>{text}</Text>
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  const styles = useStyles();
  return (
    <View style={[styles.statBox, { backgroundColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles((C) => ({
  headerTitle: { fontFamily: F.pixelBold, fontSize: 18, color: C.text },
  hero: { alignItems: 'center', gap: 8, padding: 18 },
  heroTitle: { fontFamily: F.black, fontSize: 22, color: C.text, textAlign: 'center' },
  heroText: { fontFamily: F.regular, fontSize: 15, color: C.textLight, textAlign: 'center' },
  rules: { alignSelf: 'stretch', gap: 10, marginVertical: 12 },
  rule: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  ruleText: { fontFamily: F.bold, color: C.text, fontSize: 15, flex: 1 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  statBox: { ...boxed(C, 3), flex: 1, padding: 12, alignItems: 'center' },
  statValue: { fontFamily: F.black, fontSize: 24, color: C.onAccent },
  statLabel: { fontFamily: F.pixel, fontSize: 10, color: C.onAccent, textAlign: 'center' },
  readinessValue: { fontFamily: F.black, fontSize: 44 },
  readinessHint: { fontFamily: F.regular, color: C.textLight, fontSize: 14, textAlign: 'center' },
  section: { fontFamily: F.black, fontSize: 22, color: C.text, marginTop: 28, marginBottom: 12 },
  historyRow: { ...boxed(C, 3), backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  historyBadge: {
    width: 44,
    height: 44,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: { fontFamily: F.bold, fontSize: 16 },
  historyDate: { fontFamily: F.mono, color: C.muted, fontSize: 12 },
}));
