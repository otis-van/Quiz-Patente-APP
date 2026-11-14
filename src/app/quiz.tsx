import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GridBackground } from '@/components/GridBackground';
import { Icon, IconName } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { RetroButton } from '@/components/RetroButton';
import { RoadSign } from '@/components/RoadSign';
import { chapterById } from '@/data/chapters';
import { Question } from '@/data/questions';
import { haptic } from '@/lib/haptics';
import { buildDaily, buildLesson, buildPractice, buildReview, QuizMode, xpForSession } from '@/lib/quiz';
import { AnswerLog, mistakeIds, useProgress } from '@/store/progress';
import { boxed, F, hardShadow, MAX_WIDTH, makeStyles, useColors } from '@/theme';

const PRAISE = ['Ottimo!', 'Perfetto!', 'Bravissimo!', 'Esatto!', 'Grande!', 'Continua così!'];

interface Item {
  q: Question;
  retry: boolean;
}

export default function QuizScreen() {
  const C = useColors();
  const styles = useStyles();
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
        <GridBackground />
        <Icon name="sparkle" size={88} />
        <Text style={styles.title}>Nessun errore da ripassare!</Text>
        <Text style={styles.subtitle}>Continua con le lezioni per mettere alla prova le tue conoscenze.</Text>
        <RetroButton title="Torna indietro" onPress={() => router.back()} style={{ alignSelf: 'stretch', margin: 24 }} />
      </SafeAreaView>
    );
  }

  if (summary) {
    const { xp, accuracy, secs } = summary;
    return (
      <SafeAreaView style={styles.root}>
        <GridBackground />
        <View style={[styles.inner, styles.center, { flex: 1 }]}>
          <Icon name={accuracy === 100 ? 'trophy' : accuracy >= 70 ? 'sparkle' : 'heart'} size={96} />
          <Text style={[styles.title, { marginTop: 16 }]}>
            {mode === 'lesson' ? 'Lezione completata!' : mode === 'daily' ? 'Esercizio del giorno completato!' : 'Allenamento completato!'}
          </Text>
          {accuracy === 100 && <Text style={styles.subtitle}>Nessun errore: +5 XP bonus!</Text>}
          <View style={styles.tiles}>
            <Tile label="XP" icon="bolt" value={`+${xp}`} color={C.yellow} />
            <Tile label={accuracy >= 80 ? 'OTTIMO' : 'PRECISIONE'} icon="target" value={`${accuracy}%`} color={C.green} />
            <Tile label="TEMPO" icon="clock" value={`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`} color={C.blue} />
          </View>
        </View>
        <View style={[styles.inner, styles.footer]}>
          <RetroButton title="Continua" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <GridBackground />
      <View style={[styles.inner, styles.topBar]}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Chiudi">
          <Icon name="close" size={26} />
        </Pressable>
        <ProgressBar value={progress} />
        {combo >= 3 && (
          <View style={styles.comboBox}>
            <Icon name="fire" size={18} />
            <Text style={styles.combo}>{combo}</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[styles.inner, { paddingHorizontal: 20, paddingTop: 16, gap: 18 }]}>
          {current.retry ? (
            <View style={[styles.kickerBox, { backgroundColor: C.orange }]}>
              <Text style={styles.kicker}>ERRORE PRECEDENTE</Text>
            </View>
          ) : (
            <View style={[styles.kickerBox, { backgroundColor: chapter?.color ?? C.lilac }]}>
              <Text style={styles.kicker}>
                {mode === 'daily' ? 'ESERCIZIO DEL GIORNO' : 'VERO O FALSO?'}
                {chapter ? ` · ${chapter.short.toUpperCase()}` : ''}
              </Text>
            </View>
          )}
          {current.q.sign && (
            <View style={styles.signCard}>
              <RoadSign id={current.q.sign} size={150} />
            </View>
          )}
          <View style={styles.questionRow}>
            <Icon name="trafficLight" size={56} />
            <View style={styles.speech}>
              <Text style={styles.question}>{current.q.text}</Text>
            </View>
          </View>
          <View style={{ gap: 12 }}>
            {[true, false].map((val) => (
              <Choice
                key={String(val)}
                label={val ? 'VERO' : 'FALSO'}
                icon={val ? 'check' : 'cross'}
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
        <View style={[styles.sheet, { backgroundColor: isCorrect ? C.green : C.red }]}>
          <View style={styles.inner}>
            <View style={styles.sheetHead}>
              <Icon name={isCorrect ? 'check' : 'cross'} size={30} />
              <Text style={styles.sheetTitle}>{isCorrect ? praise : 'Risposta corretta:'}</Text>
              {!isCorrect && <Text style={styles.sheetAnswer}>{current.q.answer ? 'VERO' : 'FALSO'}</Text>}
            </View>
            {current.q.explanation && <Text style={styles.sheetBody}>{current.q.explanation}</Text>}
            <RetroButton title="Continua" variant="surface" onPress={next} style={{ marginTop: 14 }} />
          </View>
        </View>
      ) : (
        <View style={[styles.inner, styles.footer]}>
          <RetroButton title="Verifica" variant="lime" disabled={selected === null} onPress={check} />
        </View>
      )}
    </SafeAreaView>
  );
}

function Choice({
  label,
  icon,
  selected,
  state,
  disabled,
  onPress,
}: {
  label: string;
  icon: IconName;
  selected: boolean;
  state: 'right' | 'wrong' | 'none';
  disabled: boolean;
  onPress: () => void;
}) {
  const C = useColors();
  const styles = useStyles();
  const bg = state === 'right' ? C.green : state === 'wrong' ? C.red : selected ? C.yellow : C.surface;
  const fg = state !== 'none' || selected ? C.onAccent : C.text;
  const down = isHeldDown(selected, disabled);
  return (
    <Pressable disabled={disabled} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}>
      {({ pressed }) => (
        <View
          style={[
            styles.choice,
            { backgroundColor: bg },
            pressed || down ? { transform: [{ translateX: 4 }, { translateY: 4 }] } : hardShadow(C, 4),
          ]}>
          <Icon name={icon} size={30} />
          <Text style={[styles.choiceText, { color: fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

/** Pulsante "premuto" (selezionato): resta abbassato finché non si verifica. */
const isHeldDown = (selected: boolean, disabled: boolean) => selected && !disabled;

function Tile({ label, value, color, icon }: { label: string; value: string; color: string; icon: IconName }) {
  const styles = useStyles();
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileLabel, { backgroundColor: color }]}>{label}</Text>
      <View style={styles.tileBody}>
        <Icon name={icon} size={22} />
        <Text style={styles.tileValue}>{value}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((C) => ({
  root: { flex: 1, backgroundColor: C.bg },
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  comboBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  combo: { fontFamily: F.black, color: C.text, fontSize: 16 },
  kickerBox: {
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  kicker: { fontFamily: F.pixel, fontSize: 11, color: C.onAccent },
  questionRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  signCard: { ...boxed(C), alignSelf: 'center', padding: 14, backgroundColor: C.white },
  speech: { ...boxed(C), flex: 1, backgroundColor: C.surface, padding: 16 },
  question: { fontFamily: F.bold, fontSize: 19, color: C.text, lineHeight: 27 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  choiceText: { fontFamily: F.pixel, fontSize: 18 },
  footer: { padding: 16, borderTopWidth: 2, borderTopColor: C.ink, backgroundColor: C.surface },
  sheet: { padding: 16, paddingBottom: 24, borderTopWidth: 2, borderTopColor: C.ink },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  sheetTitle: { fontFamily: F.black, fontSize: 21, color: C.onAccent },
  sheetAnswer: {
    fontFamily: F.pixel,
    fontSize: 16,
    color: C.onAccent,
    backgroundColor: C.white,
    borderWidth: 2,
    borderColor: C.ink,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sheetBody: { fontFamily: F.regular, fontSize: 16, marginTop: 8, lineHeight: 22, color: C.onAccent },
  title: { fontFamily: F.black, fontSize: 25, color: C.text, textAlign: 'center' },
  subtitle: { fontFamily: F.regular, fontSize: 16, color: C.textLight, textAlign: 'center', marginTop: 8 },
  tiles: { flexDirection: 'row', gap: 12, marginTop: 28, width: '100%' },
  tile: { ...boxed(C), flex: 1, overflow: 'hidden', backgroundColor: C.surface },
  tileLabel: {
    fontFamily: F.pixel,
    color: C.onAccent,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 4,
    borderBottomWidth: 2,
    borderBottomColor: C.ink,
  },
  tileBody: { paddingVertical: 14, alignItems: 'center', gap: 6 },
  tileValue: { fontFamily: F.black, fontSize: 18, color: C.text },
}));
