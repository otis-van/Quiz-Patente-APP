import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DuoButton } from '@/components/DuoButton';
import { ProgressBar } from '@/components/ProgressBar';
import { chapterById } from '@/data/chapters';
import { Question } from '@/data/questions';
import { haptic } from '@/lib/haptics';
import { buildDaily, buildLesson, buildPractice, buildReview, QuizMode, xpForSession } from '@/lib/quiz';
import { AnswerLog, mistakeIds, useProgress } from '@/store/progress';
import { C, F, MAX_WIDTH } from '@/theme';

const PRAISE = ['Ottimo!', 'Perfetto!', 'Bravissimo!', 'Esatto!', 'Grande!', 'Continua così!'];

interface Item {
  q: Question;
  retry: boolean;
}

export default function QuizScreen() {
  const params = useLocalSearchParams<{ mode?: QuizMode; chapter?: string }>();
  const mode: QuizMode = params.mode ?? 'lesson';
  const chapterId = params.chapter ? Number(params.chapter) : undefined;
  const chapter = chapterId ? chapterById(chapterId) : undefined;

  const [items, setItems] = useState<Item[]>(() => {
    const s = useProgress.getState();
    const qs =
      mode === 'daily' && chapterId
        ? buildDaily(chapterId)
        : mode === 'review'
          ? buildReview(mistakeIds(s))
          : mode === 'practice' || !chapterId
            ? buildPractice(s.questionStats)
            : buildLesson(chapterId, s.questionStats);
    return qs.map((q) => ({ q, retry: false }));
  });
  const firstCount = useMemo(() => items.filter((i) => !i.retry).length, [items]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);
  const [combo, setCombo] = useState(0);
  const [log, setLog] = useState<AnswerLog[]>([]);
  const [startedAt] = useState(() => Date.now());
  const [praise, setPraise] = useState(PRAISE[0]);
  const [summary, setSummary] = useState<{ xp: number; accuracy: number; secs: number } | null>(null);

  const current = items[index];
  const isCorrect = checked && current && selected === current.q.answer;
  const progress = (index + (checked ? 1 : 0)) / items.length;


  function check() {
    if (selected === null || !current) return;
    const ok = selected === current.q.answer;
    setLog((l) => [...l, { id: current.q.id, correct: ok }]);
    setPraise(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
    setChecked(true);
    haptic(ok ? 'success' : 'error');
    if (ok) setCombo((c) => c + 1);
    else {
      setCombo(0);
      // Come in Duolingo: la domanda sbagliata viene riproposta alla fine (una sola volta).
      if (!current.retry && mode !== 'daily') setItems((list) => [...list, { q: current.q, retry: true }]);
    }
  }

  function next() {
    if (index + 1 < items.length) {
      setIndex(index + 1);
      setSelected(null);
      setChecked(false);
    } else {
      finish();
    }
  }

  function finish() {
    // Per XP e precisione contano solo i primi tentativi (non le domande riproposte).
    const correctFirst = log.filter((a, i) => a.correct && !items[i]?.retry).length;
    const xp = xpForSession(correctFirst, firstCount);
    const store = useProgress.getState();
    store.recordAnswers(log);
    store.addXp(xp);
    if (mode === 'lesson' && chapterId) store.completeLesson(chapterId);
    if (mode === 'daily' && chapterId) store.completeDaily(chapterId);
    setSummary({
      xp,
      accuracy: firstCount ? Math.round((correctFirst / firstCount) * 100) : 0,
      secs: Math.round((Date.now() - startedAt) / 1000),
    });
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <Text style={styles.bigEmoji}>🎉</Text>
        <Text style={styles.title}>Nessun errore da ripassare!</Text>
        <Text style={styles.subtitle}>Continua con le lezioni per mettere alla prova le tue conoscenze.</Text>
        <DuoButton title="Torna indietro" onPress={() => router.back()} style={{ alignSelf: 'stretch', margin: 24 }} />
      </SafeAreaView>
    );
  }

  if (summary) {
    const { xp, accuracy, secs } = summary;
    return (
      <SafeAreaView style={styles.root}>
        <View style={[styles.inner, styles.center, { flex: 1 }]}>
          <Text style={styles.bigEmoji}>{accuracy === 100 ? '🏆' : accuracy >= 70 ? '🎉' : '💪'}</Text>
          <Text style={[styles.title, { color: C.yellowDark }]}>
            {mode === 'lesson' ? 'Lezione completata!' : mode === 'daily' ? 'Esercizio del giorno completato!' : 'Allenamento completato!'}
          </Text>
          {accuracy === 100 && <Text style={styles.subtitle}>Nessun errore: +5 XP bonus!</Text>}
          <View style={styles.tiles}>
            <Tile label="XP TOTALI" value={`⚡ ${xp}`} color={C.yellow} />
            <Tile label={accuracy >= 80 ? 'OTTIMO' : 'PRECISIONE'} value={`🎯 ${accuracy}%`} color={C.green} />
            <Tile label="TEMPO" value={`⏱️ ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`} color={C.blue} />
          </View>
        </View>
        <View style={[styles.inner, styles.footer]}>
          <DuoButton title="Continua" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={[styles.inner, styles.topBar]}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Chiudi">
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <ProgressBar value={progress} />
        {combo >= 3 && <Text style={styles.combo}>🔥 {combo}</Text>}
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[styles.inner, { paddingHorizontal: 20, paddingTop: 16, gap: 18 }]}>
          {current.retry ? (
            <Text style={[styles.kicker, { color: C.orange }]}>🔁 ERRORE PRECEDENTE</Text>
          ) : (
            <Text style={[styles.kicker, { color: C.purple }]}>
              {mode === 'daily' ? '📅 ESERCIZIO DEL GIORNO' : '✨ VERO O FALSO?'}
              {chapter ? ` · ${chapter.short.toUpperCase()}` : ''}
            </Text>
          )}
          <View style={styles.questionRow}>
            <Text style={styles.mascot}>🚦</Text>
            <View style={styles.speech}>
              <Text style={styles.question}>{current.q.text}</Text>
            </View>
          </View>
          <View style={{ gap: 12 }}>
            {[true, false].map((val) => (
              <Choice
                key={String(val)}
                label={val ? 'VERO' : 'FALSO'}
                emoji={val ? '👍' : '👎'}
                selected={selected === val}
                state={checked ? (val === current.q.answer ? 'right' : selected === val ? 'wrong' : 'none') : 'none'}
                disabled={checked}
                onPress={() => setSelected(val)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {checked ? (
        <View style={[styles.sheet, { backgroundColor: isCorrect ? C.greenLight : C.redLight }]}>
          <View style={styles.inner}>
            <Text style={[styles.sheetTitle, { color: isCorrect ? C.greenDark : C.redDark }]}>
              {isCorrect ? `✅ ${praise}` : '❌ Risposta corretta:'}
            </Text>
            {!isCorrect && (
              <Text style={[styles.sheetBody, { color: C.redDark, fontFamily: F.bold }]}>
                {current.q.answer ? 'VERO' : 'FALSO'}
              </Text>
            )}
            {current.q.explanation && (
              <Text style={[styles.sheetBody, { color: isCorrect ? C.greenDark : C.redDark }]}>
                {current.q.explanation}
              </Text>
            )}
            <DuoButton title="Continua" variant={isCorrect ? 'green' : 'red'} onPress={next} style={{ marginTop: 12 }} />
          </View>
        </View>
      ) : (
        <View style={[styles.inner, styles.footer]}>
          <DuoButton title="Verifica" disabled={selected === null} onPress={check} />
        </View>
      )}
    </SafeAreaView>
  );
}

function Choice({
  label,
  emoji,
  selected,
  state,
  disabled,
  onPress,
}: {
  label: string;
  emoji: string;
  selected: boolean;
  state: 'right' | 'wrong' | 'none';
  disabled: boolean;
  onPress: () => void;
}) {
  const palette =
    state === 'right'
      ? { border: C.green, bg: C.greenLight, fg: C.greenDark }
      : state === 'wrong'
        ? { border: C.red, bg: C.redLight, fg: C.redDark }
        : selected
          ? { border: '#84D8FF', bg: C.blueLight, fg: C.blueDark }
          : { border: C.grayLight, bg: C.white, fg: C.text };
  return (
    <Pressable disabled={disabled} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}>
      {({ pressed }) => (
        <View
          style={[
            styles.choice,
            {
              borderColor: palette.border,
              backgroundColor: palette.bg,
              borderBottomWidth: pressed ? 2 : 5,
              marginTop: pressed ? 3 : 0,
            },
          ]}>
          <Text style={{ fontSize: 26 }}>{emoji}</Text>
          <Text style={[styles.choiceText, { color: palette.fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

function Tile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.tile, { backgroundColor: color, borderColor: color }]}>
      <Text style={styles.tileLabel}>{label}</Text>
      <View style={styles.tileBody}>
        <Text style={[styles.tileValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.white },
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  close: { fontSize: 24, color: C.gray, fontFamily: F.bold },
  combo: { fontFamily: F.black, color: C.orange, fontSize: 16 },
  kicker: { fontFamily: F.black, fontSize: 13, letterSpacing: 0.6 },
  questionRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  mascot: { fontSize: 54 },
  speech: {
    flex: 1,
    borderWidth: 2,
    borderColor: C.grayLight,
    borderRadius: 16,
    padding: 16,
  },
  question: { fontFamily: F.bold, fontSize: 19, color: C.text, lineHeight: 27 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  choiceText: { fontFamily: F.black, fontSize: 18, letterSpacing: 1 },
  footer: { padding: 16, borderTopWidth: 2, borderTopColor: C.grayLight },
  sheet: { padding: 16, paddingBottom: 24 },
  sheetTitle: { fontFamily: F.black, fontSize: 22 },
  sheetBody: { fontFamily: F.regular, fontSize: 16, marginTop: 4, lineHeight: 22 },
  bigEmoji: { fontSize: 88, marginBottom: 12 },
  title: { fontFamily: F.black, fontSize: 26, color: C.text, textAlign: 'center' },
  subtitle: { fontFamily: F.regular, fontSize: 16, color: C.textLight, textAlign: 'center', marginTop: 8 },
  tiles: { flexDirection: 'row', gap: 10, marginTop: 28, width: '100%' },
  tile: { flex: 1, borderWidth: 2, borderRadius: 16, overflow: 'hidden' },
  tileLabel: { fontFamily: F.black, color: C.white, fontSize: 11, textAlign: 'center', paddingVertical: 4 },
  tileBody: { backgroundColor: C.white, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  tileValue: { fontFamily: F.black, fontSize: 17 },
});
