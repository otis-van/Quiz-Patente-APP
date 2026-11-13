import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DuoButton } from '@/components/DuoButton';
import { RoadSign } from '@/components/RoadSign';
import { chapterById } from '@/data/chapters';
import { Question } from '@/data/questions';
import { haptic } from '@/lib/haptics';
import { buildExam, EXAM_MAX_ERRORS, EXAM_SECONDS } from '@/lib/quiz';
import { useProgress } from '@/store/progress';
import { F, MAX_WIDTH, makeStyles, useColors } from '@/theme';

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
      <View style={[styles.inner, styles.top]}>
        <Pressable
          hitSlop={12}
          onPress={() => confirm('Abbandonare la prova?', 'I progressi di questa simulazione andranno persi.', () => router.back())}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <Text style={styles.counter}>
          Domanda {index + 1}/{questions.length}
        </Text>
        <View style={[styles.timer, left < 120 && { backgroundColor: C.redLight, borderColor: C.red }]}>
          <Text style={[styles.timerText, left < 120 && { color: C.redText }]}>⏱️ {fmt(left)}</Text>
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
            <Text style={[styles.cellText, (answers[i] !== null || i === index) && { color: i === index ? C.white : C.blueDark }]}>
              {i + 1}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[styles.inner, { padding: 20, gap: 20 }]}>
          <Text style={styles.kicker}>
            {ch.emoji} {ch.short.toUpperCase()}
          </Text>
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
                        sel && { borderColor: C.blueBorder, backgroundColor: C.blueLight },
                        { borderBottomWidth: pressed ? 2 : 5, marginTop: pressed ? 3 : 0 },
                      ]}>
                      <Text style={[styles.vfLetter, sel && { color: C.blueDark }]}>{val ? 'V' : 'F'}</Text>
                      <Text style={[styles.vfLabel, sel && { color: C.blueDark }]}>{val ? 'VERO' : 'FALSO'}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.inner, styles.footer]}>
        <DuoButton title="◀" variant="white" disabled={index === 0} onPress={() => setIndex(index - 1)} style={{ width: 64 }} />
        <DuoButton
          title={`Consegna (${answeredCount}/${questions.length})`}
          variant="blue"
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
        <DuoButton
          title="▶"
          variant="white"
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
      <ScrollView>
        <View style={[styles.inner, { padding: 20, alignItems: 'center' }]}>
          <Text style={{ fontSize: 90 }}>{passed ? '🎓' : '📚'}</Text>
          <Text style={[styles.resultTitle, { color: passed ? C.green : C.red }]}>{passed ? 'IDONEO!' : 'NON IDONEO'}</Text>
          <Text style={styles.resultSub}>
            {wrong.length} {wrong.length === 1 ? 'errore' : 'errori'} su {questions.length} (massimo consentito: {EXAM_MAX_ERRORS})
          </Text>
          <Text style={styles.xp}>⚡ +{passed ? 30 : 15} XP</Text>

          {wrong.length > 0 && (
            <View style={{ alignSelf: 'stretch', marginTop: 24, gap: 12 }}>
              <Text style={styles.sectionTitle}>Rivedi gli errori</Text>
              {wrong.map(({ q, a }) => (
                <View key={q.id} style={styles.wrongCard}>
                  <Text style={styles.wrongChapter}>
                    {chapterById(q.chapter).emoji} {chapterById(q.chapter).short}
                  </Text>
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
        <DuoButton title="Continua" style={{ flex: 1 }} onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((C) => ({
  root: { flex: 1, backgroundColor: C.bg },
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 14 },
  close: { fontSize: 24, color: C.gray, fontFamily: F.bold },
  counter: { flex: 1, fontFamily: F.bold, color: C.text, fontSize: 16 },
  timer: { borderWidth: 2, borderColor: C.grayLight, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  timerText: { fontFamily: F.black, color: C.text, fontSize: 16 },
  grid: { paddingHorizontal: 16, gap: 6, paddingBottom: 8 },
  cell: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellAnswered: { backgroundColor: C.blueLight, borderColor: C.blueBorder },
  cellCurrent: { backgroundColor: C.blue, borderColor: C.blueDark },
  cellText: { fontFamily: F.bold, color: C.gray, fontSize: 13 },
  kicker: { fontFamily: F.black, color: C.purple, fontSize: 13, letterSpacing: 0.6 },
  signCard: { alignSelf: 'center', padding: 14, borderRadius: 20, backgroundColor: C.grayBg, borderWidth: 2, borderColor: C.grayLight },
  question: { fontFamily: F.bold, fontSize: 21, color: C.text, lineHeight: 30 },
  vfRow: { flexDirection: 'row', gap: 12 },
  vf: {
    borderWidth: 2,
    borderColor: C.grayLight,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 4,
  },
  vfLetter: { fontFamily: F.black, fontSize: 34, color: C.text },
  vfLabel: { fontFamily: F.bold, fontSize: 14, color: C.textLight, letterSpacing: 1 },
  footer: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 2, borderTopColor: C.grayLight },
  resultTitle: { fontFamily: F.black, fontSize: 34, marginTop: 8 },
  resultSub: { fontFamily: F.regular, fontSize: 16, color: C.textLight, marginTop: 6, textAlign: 'center' },
  xp: { fontFamily: F.black, fontSize: 18, color: C.yellowDark, marginTop: 12 },
  sectionTitle: { fontFamily: F.black, fontSize: 20, color: C.text },
  wrongCard: { borderWidth: 2, borderColor: C.grayLight, borderRadius: 16, padding: 14, gap: 6 },
  wrongChapter: { fontFamily: F.bold, color: C.gray, fontSize: 12 },
  wrongText: { fontFamily: F.bold, color: C.text, fontSize: 16, lineHeight: 22 },
  wrongAnswer: { fontFamily: F.bold, color: C.textLight, fontSize: 14 },
  wrongExpl: { fontFamily: F.regular, color: C.textLight, fontSize: 14, lineHeight: 20 },
}));
