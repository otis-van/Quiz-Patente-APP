import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GridBackground } from '@/components/GridBackground';
import { Icon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { RetroButton } from '@/components/RetroButton';
import { RoadSign } from '@/components/RoadSign';
import { chapterById } from '@/data/chapters';
import { questionsOfChapter } from '@/data/questions';
import { chapterMastery, mastery, useProgress } from '@/store/progress';
import { boxed, F, MAX_WIDTH, makeStyles, useColors } from '@/theme';
import { useOpenSound } from '@/lib/sounds';

/** Guida dell'argomento: tutte le domande con risposta e il tuo livello di padronanza. */
export default function ChapterScreen() {
  useOpenSound();
  const C = useColors();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ch = chapterById(Number(id));
  const questions = questionsOfChapter(Number(id));
  const stats = useProgress((s) => s.questionStats);
  const level = chapterMastery(stats, questions.map((q) => q.id));

  if (!ch) return null;

  return (
    <SafeAreaView style={styles.root}>
      <GridBackground />
      <View style={[styles.header, { backgroundColor: ch.color }]}>
        <View style={styles.inner}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backRow} accessibilityLabel="Indietro">
            <Icon name="arrow" size={20} />
            <Text style={styles.back}>INDIETRO</Text>
          </Pressable>
          <View style={styles.headRow}>
            <View style={styles.headIcon}>
              <Icon name={ch.icon} size={36} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>ARGOMENTO {String(ch.id).padStart(2, '0')}</Text>
              <Text style={styles.title}>{ch.title}</Text>
            </View>
          </View>
          <View style={styles.levelRow}>
            <ProgressBar value={level} color={C.lime} height={16} />
            <Text style={styles.levelText}>{Math.round(level * 100)}%</Text>
          </View>
        </View>
      </View>
      <ScrollView>
        <View style={[styles.inner, { padding: 16, gap: 10 }]}>
          <Text style={styles.section}>Guida · {questions.length} domande</Text>
          {questions.map((q) => {
            const st = stats[q.id];
            const m = mastery(st);
            const badge = !st ? C.surfaceAlt : m >= 1 ? C.green : st.s === 0 ? C.red : C.yellow;
            return (
              <View key={q.id} style={styles.card}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[styles.dot, { backgroundColor: badge }]} />
                  <Text style={styles.qText}>{q.text}</Text>
                  {q.sign && <RoadSign id={q.sign} size={56} />}
                </View>
                <Text style={[styles.answer, { color: q.answer ? C.greenText : C.redText }]}>
                  {q.answer ? 'VERO' : 'FALSO'}
                </Text>
                {q.explanation && <Text style={styles.expl}>{q.explanation}</Text>}
              </View>
            );
          })}
          <View style={styles.legendRow}>
            {[
              [C.surfaceAlt, 'mai vista'],
              [C.red, 'da ripassare'],
              [C.yellow, 'in apprendimento'],
              [C.green, 'imparata'],
            ].map(([color, label]) => (
              <View key={label} style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: color, marginTop: 0 }]} />
                <Text style={styles.legend}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={[styles.inner, styles.footer]}>
        <RetroButton
          title="Esercitati"
          icon={<Icon name="star" size={18} />}
          onPress={() => router.push({ pathname: '/quiz', params: { mode: 'lesson', chapter: ch.id } })}
        />
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((C) => ({
  root: { flex: 1, backgroundColor: C.bg },
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  header: { padding: 16, borderBottomWidth: 2, borderBottomColor: C.ink },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: 14 },
  back: { fontFamily: F.pixel, color: C.onAccent, fontSize: 13 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.ink,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `3px 3px 0px ${C.ink}`,
  },
  kicker: { fontFamily: F.pixel, color: C.onAccent, fontSize: 12 },
  title: { fontFamily: F.black, color: C.onAccent, fontSize: 20, marginTop: 2, lineHeight: 26 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  levelText: { fontFamily: F.black, color: C.onAccent, width: 46, textAlign: 'right' },
  section: { fontFamily: F.black, fontSize: 20, color: C.text, marginBottom: 4 },
  card: { ...boxed(C, 3), backgroundColor: C.surface, padding: 14, gap: 6 },
  dot: { width: 14, height: 14, borderRadius: 8, borderWidth: 2, borderColor: C.ink, marginTop: 4 },
  qText: { flex: 1, fontFamily: F.bold, color: C.text, fontSize: 15, lineHeight: 21 },
  answer: { fontFamily: F.pixel, fontSize: 13, marginLeft: 24 },
  expl: { fontFamily: F.regular, color: C.textLight, fontSize: 14, marginLeft: 24, lineHeight: 20 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legend: { fontFamily: F.regular, color: C.muted, fontSize: 12 },
  footer: { padding: 16, borderTopWidth: 2, borderTopColor: C.ink, backgroundColor: C.surface },
}));
