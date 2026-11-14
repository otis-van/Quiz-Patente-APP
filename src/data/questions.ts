/**
 * Banca domande Vero/Falso, divisa per i 25 argomenti ministeriali.
 *
 * Le domande provengono dal listato delle patenti A e B (trascrizione Edizioni Neca,
 * aggiornata al 09/11/2026) e sono usate per ora SOLO PER USO PRIVATO.
 * Prima di pubblicare l'app serve la licenza dell'editore: vedi PUBBLICAZIONE.md.
 *
 * Formato di ogni riga di official.json: [id, argomento, testo, vero (1/0), figura (0 = nessuna)].
 */
import type { SignId } from '@/components/RoadSign';

import OFFICIAL from './official.json';

export interface Question {
  id: string;
  chapter: number;
  text: string;
  answer: boolean;
  explanation?: string;
  /** Figura ufficiale da mostrare con la domanda (vedi src/data/figures.ts). */
  figure?: number;
  /** Segnale illustrato (disegno SVG), usato solo se manca la figura. */
  sign?: SignId;
}

type Row = [id: string, chapter: number, text: string, answer: number, figure: number];

export const QUESTIONS: Question[] = (OFFICIAL as Row[]).map(([id, chapter, text, answer, figure]) => ({
  id,
  chapter,
  text,
  answer: answer === 1,
  figure: figure || undefined,
}));

const byId = new Map(QUESTIONS.map((q) => [q.id, q]));
const byChapter = new Map<number, Question[]>();
for (const q of QUESTIONS) {
  const list = byChapter.get(q.chapter);
  if (list) list.push(q);
  else byChapter.set(q.chapter, [q]);
}

export const questionById = (id: string) => byId.get(id);
export const questionsOfChapter = (chapter: number) => byChapter.get(chapter) ?? [];
