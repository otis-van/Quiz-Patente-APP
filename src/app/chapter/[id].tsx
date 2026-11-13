import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DuoButton } from '@/components/DuoButton';
import { ProgressBar } from '@/components/ProgressBar';
import { chapterById } from '@/data/chapters';
import { questionsOfChapter } from '@/data/questions';
import { chapterMastery, mastery, useProgress } from '@/store/progress';
import { C, F, MAX_WIDTH } from '@/theme';

/** Guida dell'argomento: tutte le domande con risposta e il tuo livello di padronanza. */
export default function ChapterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ch = chapterById(Number(id));
  const questions = questionsOfChapter(Number(id));
  const stats = useProgress((s) => s.questionStats);
  const level = chapterMastery(stats, questions.map((q) => q.id));

  if (!ch) return null;

  return (
    <SafeAreaView style={styles.root}>
      <View style={[styles.header, { backgroundColor: ch.color, borderBottomColor: ch.colorDark }]}>
        <View style={styles.inner}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.back}>‹ Indietro</Text>
          </Pressable>
          <Text style={styles.kicker}>
            {ch.emoji} ARGOMENTO {ch.id}
          </Text>
          <Text style={styles.title}>{ch.title}</Text>
          <View style={styles.levelRow}>
            <ProgressBar value={level} color={C.white} height={12} />
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
            const badge = !st ? '⚪' : m >= 1 ? '🟢' : st.s === 0 ? '🔴' : '🟡';
            return (
              <View key={q.id} style={styles.card}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Text>{badge}</Text>
                  <Text style={styles.qText}>{q.text}</Text>
                </View>
                <Text style={[styles.answer, { color: q.answer ? C.greenDark : C.redDark }]}>
                  {q.answer ? 'VERO' : 'FALSO'}
                </Text>
                {q.explanation && <Text style={styles.expl}>{q.explanation}</Text>}
              </View>
            );
          })}
          <Text style={styles.legend}>⚪ mai vista · 🔴 da ripassare · 🟡 in apprendimento · 🟢 imparata</Text>
        </View>
      </ScrollView>
      <View style={[styles.inner, styles.footer]}>
        <DuoButton
          title="Esercitati su questo argomento"
          onPress={() => router.push({ pathname: '/quiz', params: { mode: 'lesson', chapter: ch.id } })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.white },
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  header: { padding: 16, borderBottomWidth: 5 },
  back: { fontFamily: F.bold, color: C.white, fontSize: 16, marginBottom: 12 },
  kicker: { fontFamily: F.black, color: 'rgba(255,255,255,0.85)', fontSize: 13, letterSpacing: 1 },
  title: { fontFamily: F.black, color: C.white, fontSize: 24, marginTop: 4 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  levelText: { fontFamily: F.black, color: C.white, width: 44, textAlign: 'right' },
  section: { fontFamily: F.black, fontSize: 20, color: C.text },
  card: { borderWidth: 2, borderColor: C.grayLight, borderRadius: 16, padding: 14, gap: 6 },
  qText: { flex: 1, fontFamily: F.bold, color: C.text, fontSize: 15, lineHeight: 21 },
  answer: { fontFamily: F.black, fontSize: 14, letterSpacing: 0.8, marginLeft: 28 },
  expl: { fontFamily: F.regular, color: C.textLight, fontSize: 14, marginLeft: 28, lineHeight: 20 },
  legend: { fontFamily: F.regular, color: C.gray, fontSize: 12, textAlign: 'center', marginTop: 8 },
  footer: { padding: 16, borderTopWidth: 2, borderTopColor: C.grayLight },
});
