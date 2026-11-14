import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { PathNode, NodeState } from '@/components/PathNode';
import { Icon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { RetroButton } from '@/components/RetroButton';
import { Screen } from '@/components/Screen';
import { StatsBar } from '@/components/StatsBar';
import { Window } from '@/components/Window';
import { Chapter, CHAPTERS, LESSONS_PER_CHAPTER } from '@/data/chapters';
import { questionsOfChapter } from '@/data/questions';
import { chapterMastery, useProgress } from '@/store/progress';
import { boxed, F, makeStyles, useColors } from '@/theme';

const OFFSETS = [0, 48, 72, 48, 0, -48, -72, -48];

export default function PathScreen() {
  const C = useColors();
  const styles = useStyles();
  const lessonsDone = useProgress((s) => s.lessonsDone);
  const next = CHAPTERS.find((c) => (lessonsDone[c.id] ?? 0) < LESSONS_PER_CHAPTER);

  return (
    <Screen
      header={
        <StatsBar
          left={
            <View style={styles.brandRow}>
              <Icon name="car" size={26} />
              <Text style={styles.brand}>PATENTE.B</Text>
            </View>
          }
        />
      }>
      {next && (
        <Window title="continua.exe" color={C.pink} style={{ marginTop: 20 }} bodyStyle={{ gap: 12 }}>
          <View style={styles.continueRow}>
            <View style={[styles.continueIcon, { backgroundColor: next.color }]}>
              <Icon name={next.icon} size={32} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.continueLabel}>Riprendi da dove eri rimasto</Text>
              <Text style={styles.continueTitle}>
                {next.short} · Lezione {(lessonsDone[next.id] ?? 0) + 1}
              </Text>
            </View>
          </View>
          <RetroButton
            title="Inizia lezione"
            icon={<Icon name="star" size={18} />}
            onPress={() => router.push({ pathname: '/quiz', params: { mode: 'lesson', chapter: next.id } })}
          />
        </Window>
      )}
      {CHAPTERS.map((ch) => (
        <Unit key={ch.id} chapter={ch} />
      ))}
    </Screen>
  );
}

function Unit({ chapter }: { chapter: Chapter }) {
  const styles = useStyles();
  const ids = questionsOfChapter(chapter.id).map((q) => q.id);
  const { done, mastery } = useProgress(
    useShallow((s) => ({ done: s.lessonsDone[chapter.id] ?? 0, mastery: chapterMastery(s.questionStats, ids) })),
  );

  const start = () => router.push({ pathname: '/quiz', params: { mode: 'lesson', chapter: chapter.id } });

  return (
    <View style={styles.unit}>
      <Pressable onPress={() => router.push({ pathname: '/chapter/[id]', params: { id: chapter.id } })}>
        {({ pressed }) => (
          <View style={[styles.banner, { backgroundColor: chapter.color }, pressed && styles.pressed]}>
            <View style={styles.bannerIcon}>
              <Icon name={chapter.icon} size={34} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerKicker}>ARGOMENTO {String(chapter.id).padStart(2, '0')}</Text>
              <Text style={styles.bannerTitle}>{chapter.title}</Text>
              <View style={styles.masteryRow}>
                <ProgressBar value={mastery} color={chapter.color} height={14} />
                <Text style={styles.masteryText}>{Math.round(mastery * 100)}%</Text>
              </View>
            </View>
            <View style={styles.guideBtn}>
              <Icon name="book" size={22} />
            </View>
          </View>
        )}
      </Pressable>

      <View style={styles.path}>
        {Array.from({ length: LESSONS_PER_CHAPTER }, (_, i) => {
          const state: NodeState = i < done ? 'done' : i === done ? 'current' : 'locked';
          const last = i === LESSONS_PER_CHAPTER - 1;
          const offset = OFFSETS[(i + chapter.id * 2) % OFFSETS.length];
          return (
            <PathNode
              key={i}
              state={state}
              color={chapter.color}
              icon={last ? 'trophy' : state === 'done' ? 'check' : state === 'locked' ? 'lock' : 'star'}
              offset={offset}
              label={last ? 'RIPASSO FINALE' : `LEZIONE ${i + 1}`}
              onPress={() => {
                if (state !== 'locked') start();
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((C) => ({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { fontFamily: F.pixelBold, fontSize: 16, color: C.text },
  continueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  continueIcon: { ...boxed(C, 0), width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  continueLabel: { fontFamily: F.regular, color: C.textLight, fontSize: 13 },
  continueTitle: { fontFamily: F.black, color: C.text, fontSize: 17 },
  unit: { marginTop: 28 },
  banner: { ...boxed(C), padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pressed: { transform: [{ translateX: 4 }, { translateY: 4 }], boxShadow: 'none' },
  bannerIcon: {
    width: 50,
    height: 50,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.ink,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerKicker: { fontFamily: F.pixel, color: C.onAccent, fontSize: 11, letterSpacing: 0.5 },
  bannerTitle: { fontFamily: F.bold, color: C.onAccent, fontSize: 17, marginTop: 2, lineHeight: 21 },
  masteryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  masteryText: { fontFamily: F.black, color: C.onAccent, fontSize: 13, width: 42, textAlign: 'right' },
  guideBtn: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.ink,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `2px 2px 0px ${C.ink}`,
  },
  path: { alignItems: 'center', paddingVertical: 14 },
}));
