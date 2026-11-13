import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { DuoButton } from '@/components/DuoButton';
import { PathNode, NodeState } from '@/components/PathNode';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { StatsBar } from '@/components/StatsBar';
import { Chapter, CHAPTERS, LESSONS_PER_CHAPTER } from '@/data/chapters';
import { questionsOfChapter } from '@/data/questions';
import { chapterMastery, useProgress } from '@/store/progress';
import { F, makeStyles } from '@/theme';

const OFFSETS = [0, 48, 72, 48, 0, -48, -72, -48];
const NODE_ICONS = ['★', '★', '★', '🏆'];

export default function PathScreen() {
  const styles = useStyles();
  const lessonsDone = useProgress((s) => s.lessonsDone);
  const next = CHAPTERS.find((c) => (lessonsDone[c.id] ?? 0) < LESSONS_PER_CHAPTER);

  return (
    <Screen header={<StatsBar left={<Text style={styles.brand}>🚗 Patente B</Text>} />}>
      {next && (
        <View style={styles.continueCard}>
          <Text style={styles.continueLabel}>CONTINUA DA DOVE ERI RIMASTO</Text>
          <Text style={styles.continueTitle}>
            {next.emoji} {next.short} · Lezione {(lessonsDone[next.id] ?? 0) + 1}
          </Text>
          <DuoButton
            title="Inizia lezione"
            onPress={() => router.push({ pathname: '/quiz', params: { mode: 'lesson', chapter: next.id } })}
          />
        </View>
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
      <Pressable
        onPress={() => router.push({ pathname: '/chapter/[id]', params: { id: chapter.id } })}
        style={[styles.banner, { backgroundColor: chapter.color, borderBottomColor: chapter.colorDark }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerKicker}>ARGOMENTO {chapter.id}</Text>
          <Text style={styles.bannerTitle}>{chapter.title}</Text>
          <View style={styles.masteryRow}>
            <ProgressBar value={mastery} color="rgba(255,255,255,0.95)" height={10} />
            <Text style={styles.masteryText}>{Math.round(mastery * 100)}%</Text>
          </View>
        </View>
        <View style={[styles.guideBtn, { borderColor: chapter.colorDark }]}>
          <Text style={{ fontSize: 22 }}>📖</Text>
        </View>
      </Pressable>

      <View style={styles.path}>
        {Array.from({ length: LESSONS_PER_CHAPTER }, (_, i) => {
          const state: NodeState = i < done ? 'done' : i === done ? 'current' : 'locked';
          const offset = OFFSETS[(i + chapter.id * 2) % OFFSETS.length];
          return (
            <PathNode
              key={i}
              state={state}
              color={chapter.color}
              colorDark={chapter.colorDark}
              icon={state === 'done' && i < LESSONS_PER_CHAPTER - 1 ? '✓' : state === 'locked' && i < LESSONS_PER_CHAPTER - 1 ? '🔒' : NODE_ICONS[i]}
              offset={offset}
              label={i === LESSONS_PER_CHAPTER - 1 ? 'RIPASSO FINALE' : `LEZIONE ${i + 1}`}
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
  brand: { fontFamily: F.black, fontSize: 18, color: C.green },
  continueCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: C.grayLight,
    gap: 10,
  },
  continueLabel: { fontFamily: F.bold, color: C.gray, fontSize: 12, letterSpacing: 0.8 },
  continueTitle: { fontFamily: F.bold, color: C.text, fontSize: 18 },
  unit: { marginTop: 24 },
  banner: {
    borderRadius: 16,
    padding: 16,
    borderBottomWidth: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerKicker: { fontFamily: F.bold, color: 'rgba(255,255,255,0.85)', fontSize: 12, letterSpacing: 1 },
  bannerTitle: { fontFamily: F.bold, color: C.white, fontSize: 18, marginTop: 2 },
  masteryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  masteryText: { fontFamily: F.bold, color: C.white, fontSize: 13, width: 40, textAlign: 'right' },
  guideBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  path: { alignItems: 'center', paddingVertical: 12 },
}));
