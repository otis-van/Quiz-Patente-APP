import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { LESSONS_PER_CHAPTER } from '@/data/chapters';
import { computeStreak, dayKey } from '@/lib/date';

/** Statistiche di una singola domanda (c = corrette, w = sbagliate, s = serie corrette, t = ultimo tentativo). */
export interface QuestionStat {
  c: number;
  w: number;
  s: number;
  t: number;
}

export interface ExamRecord {
  id: string;
  at: number;
  errors: number;
  total: number;
  passed: boolean;
  seconds: number;
  wrongIds: string[];
}

/** Dati sincronizzati con l'account. Tutti i campi sono "unibili" senza conflitti (vedi mergeProgress). */
export interface ProgressData {
  xpByDay: Record<string, number>;
  lessonsDone: Record<string, number>;
  dailyDone: Record<string, number[]>;
  questionStats: Record<string, QuestionStat>;
  exams: ExamRecord[];
  dailyGoal: number;
  settingsAt: number;
}

export interface AnswerLog {
  id: string;
  correct: boolean;
}

interface ProgressState extends ProgressData {
  updatedAt: number;
  recordAnswers: (answers: AnswerLog[]) => void;
  addXp: (xp: number) => void;
  completeLesson: (chapter: number) => void;
  completeDaily: (chapter: number) => void;
  addExam: (exam: ExamRecord) => void;
  setDailyGoal: (xp: number) => void;
  replaceData: (data: ProgressData) => void;
  reset: () => void;
}

export const emptyProgress = (): ProgressData => ({
  xpByDay: {},
  lessonsDone: {},
  dailyDone: {},
  questionStats: {},
  exams: [],
  dailyGoal: 20,
  settingsAt: 0,
});

export const pickData = (s: ProgressData): ProgressData => ({
  xpByDay: s.xpByDay,
  lessonsDone: s.lessonsDone,
  dailyDone: s.dailyDone,
  questionStats: s.questionStats,
  exams: s.exams,
  dailyGoal: s.dailyGoal,
  settingsAt: s.settingsAt,
});

/**
 * Unisce i progressi di due dispositivi. L'operazione è idempotente:
 * unire due volte gli stessi dati non duplica nulla.
 */
export function mergeProgress(a: ProgressData, b: ProgressData): ProgressData {
  const maxMap = (x: Record<string, number>, y: Record<string, number>) => {
    const out = { ...x };
    for (const [k, v] of Object.entries(y)) out[k] = Math.max(out[k] ?? 0, v);
    return out;
  };
  const dailyDone: Record<string, number[]> = { ...a.dailyDone };
  for (const [k, v] of Object.entries(b.dailyDone ?? {})) {
    dailyDone[k] = [...new Set([...(dailyDone[k] ?? []), ...v])].sort((m, n) => m - n);
  }
  const questionStats = { ...a.questionStats };
  for (const [k, v] of Object.entries(b.questionStats ?? {})) {
    const cur = questionStats[k];
    if (!cur || v.t > cur.t || (v.t === cur.t && v.c + v.w > cur.c + cur.w)) questionStats[k] = v;
  }
  const exams = new Map(a.exams.map((e) => [e.id, e]));
  for (const e of b.exams ?? []) exams.set(e.id, e);
  const newerSettings = (b.settingsAt ?? 0) > a.settingsAt ? b : a;
  return {
    xpByDay: maxMap(a.xpByDay, b.xpByDay ?? {}),
    lessonsDone: maxMap(a.lessonsDone, b.lessonsDone ?? {}),
    dailyDone,
    questionStats,
    exams: [...exams.values()].sort((x, y) => y.at - x.at).slice(0, 100),
    dailyGoal: newerSettings.dailyGoal,
    settingsAt: newerSettings.settingsAt,
  };
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      ...emptyProgress(),
      updatedAt: 0,
      recordAnswers: (answers) =>
        set((s) => {
          const stats = { ...s.questionStats };
          const now = Date.now();
          for (const { id, correct } of answers) {
            const cur = stats[id] ?? { c: 0, w: 0, s: 0, t: 0 };
            stats[id] = correct
              ? { c: cur.c + 1, w: cur.w, s: cur.s + 1, t: now }
              : { c: cur.c, w: cur.w + 1, s: 0, t: now };
          }
          return { questionStats: stats, updatedAt: now };
        }),
      addXp: (xp) =>
        set((s) => {
          const k = dayKey();
          return { xpByDay: { ...s.xpByDay, [k]: (s.xpByDay[k] ?? 0) + xp }, updatedAt: Date.now() };
        }),
      completeLesson: (chapter) =>
        set((s) => {
          const k = String(chapter);
          const done = Math.min(LESSONS_PER_CHAPTER, (s.lessonsDone[k] ?? 0) + 1);
          return { lessonsDone: { ...s.lessonsDone, [k]: done }, updatedAt: Date.now() };
        }),
      completeDaily: (chapter) =>
        set((s) => {
          const k = dayKey();
          const list = [...new Set([...(s.dailyDone[k] ?? []), chapter])];
          return { dailyDone: { ...s.dailyDone, [k]: list }, updatedAt: Date.now() };
        }),
      addExam: (exam) => set((s) => ({ exams: [exam, ...s.exams].slice(0, 100), updatedAt: Date.now() })),
      setDailyGoal: (xp) => set({ dailyGoal: xp, settingsAt: Date.now(), updatedAt: Date.now() }),
      replaceData: (data) => set({ ...data }),
      reset: () => set({ ...emptyProgress(), updatedAt: Date.now() }),
    }),
    {
      name: 'quiz-patente-progress',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/* ---------- Selettori derivati ---------- */

export const totalXp = (s: ProgressData) => Object.values(s.xpByDay).reduce((a, b) => a + b, 0);
export const todayXp = (s: ProgressData) => s.xpByDay[dayKey()] ?? 0;
export const streakOf = (s: ProgressData) =>
  computeStreak(Object.entries(s.xpByDay).filter(([, v]) => v > 0).map(([k]) => k));

/** Padronanza di una domanda: 0 (mai vista / sbagliata) → 1 (risposta giusta più volte di fila). */
export const mastery = (stat?: QuestionStat) => (stat ? Math.min(1, stat.s / 3) : 0);

export function chapterMastery(stats: Record<string, QuestionStat>, ids: string[]): number {
  if (ids.length === 0) return 0;
  return ids.reduce((acc, id) => acc + mastery(stats[id]), 0) / ids.length;
}

/** Domande da ripassare: sbagliate almeno una volta e non ancora consolidate. */
export const mistakeIds = (s: ProgressData) =>
  Object.entries(s.questionStats)
    .filter(([, v]) => v.w > 0 && v.s < 2)
    .sort((a, b) => b[1].t - a[1].t)
    .map(([k]) => k);
