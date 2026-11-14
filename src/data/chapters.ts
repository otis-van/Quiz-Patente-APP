/**
 * I 25 argomenti del programma ministeriale per l'esame teorico della patente B.
 */
import type { IconName } from '@/components/PixelIcon';

export interface Chapter {
  id: number;
  title: string;
  short: string;
  icon: IconName;
  color: string;
}

/** Accenti pastello (gli stessi in tema chiaro e scuro). */
const palette = ['#C9B5FF', '#9DEBDC', '#FFD54A', '#FF9ECF', '#8DB9FF', '#D4F25A', '#FFA866'];

const raw: [string, string, IconName][] = [
  ['Definizioni generali e doveri nell’uso della strada', 'Definizioni', 'book'],
  ['Segnali di pericolo', 'Pericolo', 'warning'],
  ['Segnali di divieto', 'Divieto', 'noEntry'],
  ['Segnali di obbligo', 'Obbligo', 'mandatory'],
  ['Segnali di precedenza', 'Precedenza', 'yield'],
  ['Segnaletica orizzontale e segni sugli ostacoli', 'Segnaletica orizzontale', 'road'],
  ['Segnalazioni semaforiche e degli agenti del traffico', 'Semafori e agenti', 'trafficLight'],
  ['Segnali di indicazione', 'Indicazione', 'signpost'],
  ['Segnali complementari, temporanei e di cantiere', 'Cantieri', 'cone'],
  ['Pannelli integrativi dei segnali', 'Pannelli integrativi', 'panel'],
  ['Limiti di velocità, pericolo e intralcio alla circolazione', 'Velocità', 'gauge'],
  ['Distanza di sicurezza', 'Distanza di sicurezza', 'arrows'],
  ['Norme sulla circolazione dei veicoli', 'Circolazione', 'car'],
  ['Ordine di precedenza agli incroci', 'Incroci', 'crossroad'],
  ['Norme sul sorpasso', 'Sorpasso', 'overtake'],
  ['Fermata, sosta, arresto e partenza', 'Fermata e sosta', 'parking'],
  ['Norme varie: autostrade, traino, veicolo fermo, spie', 'Norme varie', 'wheel'],
  ['Uso delle luci, dei dispositivi acustici e dei proiettori', 'Luci e clacson', 'bulb'],
  ['Cinture, sistemi di ritenuta per bambini e casco', 'Cinture e casco', 'shield'],
  ['Patenti, sanzioni, documenti e obblighi verso gli agenti', 'Patenti e sanzioni', 'idCard'],
  ['Incidenti stradali e comportamento in caso di incidente', 'Incidenti', 'aid'],
  ['Condizioni fisiche e psichiche, alcol, droghe e primo soccorso', 'Alcol e salute', 'glass'],
  ['Responsabilità civile, penale e assicurazione', 'Assicurazione', 'doc'],
  ['Consumi, ambiente e inquinamento', 'Ambiente', 'leaf'],
  ['Elementi del veicolo, manutenzione e stabilità', 'Veicolo', 'drop'],
];

export const CHAPTERS: Chapter[] = raw.map(([title, short, icon], i) => ({
  id: i + 1,
  title,
  short,
  icon,
  color: palette[i % palette.length],
}));

export const chapterById = (id: number) => CHAPTERS[id - 1];

/** Numero di lezioni (nodi del percorso) per ciascun capitolo. */
export const LESSONS_PER_CHAPTER = 4;
