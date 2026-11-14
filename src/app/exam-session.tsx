import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GridBackground } from '@/components/GridBackground';
import { PixelIcon } from '@/components/PixelIcon';
import { RetroButton } from '@/components/RetroButton';
import { RoadSign } from '@/components/RoadSign';
import { chapterById } from '@/data/chapters';
import { Question } from '@/data/questions';
import { haptic } from '@/lib/haptics';
import { buildExam, EXAM_MAX_ERRORS, EXAM_SECONDS } from '@/lib/quiz';
import { useProgress } from '@/store/progress';
import { boxed, F, hardShadow, MAX_WIDTH, makeStyles, useColors } from '@/theme';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function confirm(title: string, message: string, onOk: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onOk();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Annulla', style: 'cancel' },
    { text: 'OK', onPress: onOk },
  ]);
}

export default function ExamSession() {
  const C = useColors();
  const styles = useStyles();
  const [questions] = useState<Question[]>(buildExam);
  const [answers, setAnswers] = useState<(boolean | null)[]>(() => questions.map(() => null));
  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState(EXAM_SECONDS);
  const [done, setDone] = useState(false);
  const startedAt = useRef(Date.now());
  const submitted = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => {
      const remaining = EXAM_SECONDS - Math.floor((Date.now() - startedAt.current) / 1000);
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) submit();
    }, 500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function submit() {
    if (submitted.current) return;
    submitted.current = true;
    const final = answersRef.current;
    const wrongIds = questions.filter((q, i) => final[i] !== q.answer).map((q) => q.id);
    const errors = wrongIds.length;
    const passed = errors <= EXAM_MAX_ERRORS;
    const store = useProgress.getState();
    store.recordAnswers(
      questions.flatMap((q, i) => (final[i] === null ? [] : [{ id: q.id, correct: final[i] === q.answer }])),
    );
    store.addExam({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: Date.now(),
      errors,
      total: questions.length,
      passed,
      seconds: Math.min(EXAM_SECONDS, Math.round((Date.now() - startedAt.current) / 1000)),
      wrongIds,
    });
    store.addXp(passed ? 30 : 15);
    haptic(passed ? 'success' : 'error');
    setDone(true);
  }

  const answer = (val: boolean) => {
    haptic('light');
    setAnswers((a) => a.map((x, i) => (i === index ? val : x)));
    if (index + 1 < questions.length) setTimeout(() => setIndex((i) => Math.min(i + 1, questions.length - 1)), 180);
  };

  if (done) return <ExamResult questions={questions} answers={answers} />;

  const q = questions[index];
  const answeredCount = answers.filter((a) => a !== null).length;
  const ch = chapterById(q.chapter);

  return (
    <SafeAreaView style={styles.root}>
      <GridBackground />
      <View style={[styles.inner, styles.top]}>
        <Pressable
          hitSlop={12}
          onPress={() => confirm('Abbandonare la prova?', 'I progressi di questa simulazione andranno persi.', () => router.back())}>
          <PixelIcon name="close" size={26} />
        </Pressable>
        <Text style={styles.counter}>
          Domanda {index + 1}/{questions.length}
        </Text>
        <View style={[styles.timer, left < 120 && { backgroundColor: C.red }]}>
          <Text style={[styles.timerText, left < 120 && { color: C.onAccent }]}>{fmt(left)}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.grid}>
        {questions.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => setIndex(i)}
            style={[
              styles.cell,
              answers[i] !== null && styles.cellAnswered,
              i === index && styles.cellCurrent,
            ]}>
            <Text style={[styles.cellText, (answers[i] !== null || i === index) && { color: C.onAccent }]}>
              {i + 1}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[styles.inner, { padding: 20, gap: 20 }]}>
          <View style={[styles.kickerBox, { backgroundColor: ch.color }]}>
            <PixelIcon name={ch.icon} size={16} />
            <Text style={styles.kicker}>{ch.short.toUpperCase()}</Text>
          </View>
          {q.sign && (
            <View style={styles.signCard}>
              <RoadSign id={q.sign} size={150} />
            </View>
          )}
          <Text style={styles.question}>{q.text}</Text>
          <View style={styles.vfRow}>
            {[true, false].map((val) => {
              const sel = answers[index] === val;
              return (
                <Pressable key={String(val)} style={{ flex: 1 }} onPress={() => answer(val)}>
                  {({ pressed }) => (
                    <View
                      style={[
                        styles.vf,
                        sel && { backgroundColor: C.yellow },
                        pressed || sel ? { transform: [{ translateX: 4 }, { translateY: 4 }] } : hardShadow(C, 4),
                      ]}>
                      <Text style={[styles.vfLetter, sel && { color: C.onAccent }]}>{val ? 'V' : 'F'}</Text>
                      <Text style={[styles.vfLabel, sel && { color: C.onAccent }]}>{val ? 'VERO' : 'FALSO'}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.inner, styles.footer]}>
        <RetroButton
          title=""
          icon={<PixelIcon name="arrow" size={22} />}
          variant="surface"
          disabled={index === 0}
          onPress={() => setIndex(index - 1)}
          style={{ width: 64 }}
        />
        <RetroButton
          title={`Consegna ${answeredCount}/${questions.length}`}
          variant="lime"
          style={{ flex: 1 }}
          onPress={() =>
            confirm(
              'Consegnare la prova?',
              answeredCount < questions.length
                ? `Hai ancora ${questions.length - answeredCount} domande senza risposta: verranno contate come errori.`
                : 'Potrai vedere subito il risultato.',
              submit,
            )
          }
        />
        <RetroButton
          title=""
          icon={<PixelIcon name="arrow" size={22} flip />}
          variant="surface"
          disabled={index === questions.length - 1}
          onPress={() => setIndex(index + 1)}
          style={{ width: 64 }}
        />
      </View>
    </SafeAreaView>
  );
}

function ExamResult({ questions, answers }: { questions: Question[]; answers: (boolean | null)[] }) {
  const C = useColors();
  const styles = useStyles();
  const wrong = questions.map((q, i) => ({ q, a: answers[i] })).filter(({ q, a }) => a !== q.answer);
  const passed = wrong.length <= EXAM_MAX_ERRORS;
  return (
    <SafeAreaView style={styles.root}>
      <GridBackground />
      <ScrollView>
        <View style={[styles.inner, { padding: 20, alignItems: 'center' }]}>
          <PixelIcon name={passed ? 'cap' : 'book'} size={96} />
          <View style={[styles.resultBadge, { backgroundColor: passed ? C.green : C.red }]}>
            <Text style={styles.resultTitle}>{passed ? 'IDONEO!' : 'NON IDONEO'}</Text>
          </View>
          <Text style={styles.resultSub}>
            {wrong.length} {wrong.length === 1 ? 'errore' : 'errori'} su {questions.length} (massimo consentito: {EXAM_MAX_ERRORS})
          </Text>
          <View style={styles.xpRow}>
            <PixelIcon name="bolt" size={22} />
            <Text style={styles.xp}>+{passed ? 30 : 15} XP</Text>
          </View>

          {wrong.length > 0 && (
            <View style={{ alignSelf: 'stretch', marginTop: 24, gap: 12 }}>
              <Text style={styles.sectionTitle}>Rivedi gli errori</Text>
              {wrong.map(({ q, a }) => (
                <View key={q.id} style={styles.wrongCard}>
                  <View style={styles.wrongChapterRow}>
                    <PixelIcon name={chapterById(q.chapter).icon} size={16} />
                    <Text style={styles.wrongChapter}>{chapterById(q.chapter).short.toUpperCase()}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    {q.sign && <RoadSign id={q.sign} size={56} />}
                    <Text style={[styles.wrongText, { flex: 1 }]}>{q.text}</Text>
                  </View>
                  <Text style={styles.wrongAnswer}>
                    Tua risposta: <Text style={{ color: C.redText }}>{a === null ? '—' : a ? 'VERO' : 'FALSO'}</Text> · Corretta:{' '}
                    <Text style={{ color: C.greenText }}>{q.answer ? 'VERO' : 'FALSO'}</Text>
                  </Text>
                  {q.explanation && <Text style={styles.wrongExpl}>{q.explanation}</Text>}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <View style={[styles.inner, styles.footer]}>
        <RetroButton title="Continua" style={{ flex: 1 }} onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((C) => ({
  root: { flex: 1, backgroundColor: C.bg },
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 14 },
  counter: { flex: 1, fontFamily: F.pixel, color: C.text, fontSize: 14 },
  timer: { ...boxed(C, 2), backgroundColor: C.ink, paddingHorizontal: 10, paddingVertical: 4 },
  timerText: { fontFamily: F.pixel, color: C.lime, fontSize: 16 },
  grid: { paddingHorizontal: 16, gap: 6, paddingBottom: 10, paddingTop: 2 },
  cell: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: C.ink,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellAnswered: { backgroundColor: C.lilac },
  cellCurrent: { backgroundColor: C.yellow, ...hardShadow(C, 2) },
  cellText: { fontFamily: F.mono, color: C.muted, fontSize: 13 },
  kickerBox: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  kicker: { fontFamily: F.pixel, color: C.onAccent, fontSize: 11 },
  signCard: { ...boxed(C), alignSelf: 'center', padding: 14, backgroundColor: C.white },
  question: { fontFamily: F.bold, fontSize: 21, color: C.text, lineHeight: 30 },
  vfRow: { flexDirection: 'row', gap: 14 },
  vf: {
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 6,
    backgroundColor: C.surface,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 4,
  },
  vfLetter: { fontFamily: F.black, fontSize: 36, color: C.text },
  vfLabel: { fontFamily: F.pixel, fontSize: 13, color: C.textLight },
  footer: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 2, borderTopColor: C.ink, backgroundColor: C.surface },
  resultBadge: { ...boxed(C), paddingHorizontal: 16, paddingVertical: 6, marginTop: 16 },
  resultTitle: { fontFamily: F.pixelBold, fontSize: 28, color: C.onAccent },
  resultSub: { fontFamily: F.regular, fontSize: 16, color: C.textLight, marginTop: 14, textAlign: 'center' },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  xp: { fontFamily: F.black, fontSize: 18, color: C.text },
  sectionTitle: { fontFamily: F.black, fontSize: 21, color: C.text },
  wrongCard: { ...boxed(C, 3), backgroundColor: C.surface, padding: 14, gap: 8 },
  wrongChapterRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  wrongChapter: { fontFamily: F.pixel, color: C.muted, fontSize: 11 },
  wrongText: { fontFamily: F.bold, color: C.text, fontSize: 16, lineHeight: 22 },
  wrongAnswer: { fontFamily: F.bold, color: C.textLight, fontSize: 14 },
  wrongExpl: { fontFamily: F.regular, color: C.textLight, fontSize: 14, lineHeight: 20 },
}));
