import { CHAPTERS } from '@/data/chapters';
import { QUESTIONS, Question, questionById, questionsOfChapter } from '@/data/questions';
import { dayKey } from '@/lib/date';
import { seededRandom, shuffle } from '@/lib/random';
import { mastery, QuestionStat } from '@/store/progress';

export type QuizMode = 'lesson' | 'daily' | 'review' | 'practice';

export const EXAM_QUESTIONS = 30;
export const EXAM_MAX_ERRORS = 3;
export const EXAM_SECONDS = 20 * 60;
export const LESSON_SIZE = 8;
export const DAILY_SIZE = 5;

/** Prima le domande meno padroneggiate, con un pizzico di casualità. */
function prioritize(pool: Question[], stats: Record<string, QuestionStat>, size: number): Question[] {
  return shuffle(pool)
    .map((q) => ({ q, score: mastery(stats[q.id]) + Math.random() * 0.3 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, size)
    .map((x) => x.q);
}

export function buildLesson(chapter: number, stats: Record<string, QuestionStat>): Question[] {
  return prioritize(questionsOfChapter(chapter), stats, LESSON_SIZE);
}

/** Esercizio del giorno: stesso set per tutti i dispositivi nella stessa data. */
export function buildDaily(chapter: number, date = dayKey()): Question[] {
  return shuffle(questionsOfChapter(chapter), seededRandom(`${date}#${chapter}`)).slice(0, DAILY_SIZE);
}

export function buildReview(ids: string[]): Question[] {
  return shuffle(ids.map(questionById).filter((q): q is Question => !!q)).slice(0, 10);
}

/** Allenamento misto sui capitoli più deboli. */
export function buildPractice(stats: Record<string, QuestionStat>): Question[] {
  return prioritize(QUESTIONS, stats, 10);
}

/** Simulazione d'esame: 30 domande, almeno una per ciascuno dei 25 argomenti. */
export function buildExam(): Question[] {
  const picked: Question[] = [];
  for (const ch of CHAPTERS) {
    const [q] = shuffle(questionsOfChapter(ch.id));
    if (q) picked.push(q);
  }
  const used = new Set(picked.map((q) => q.id));
  const extra = shuffle(QUESTIONS.filter((q) => !used.has(q.id))).slice(0, EXAM_QUESTIONS - picked.length);
  return [...picked, ...extra].sort((a, b) => a.chapter - b.chapter).slice(0, EXAM_QUESTIONS);
}

export const xpForSession = (correct: number, total: number) =>
  10 + correct + (total > 0 && correct === total ? 5 : 0);
