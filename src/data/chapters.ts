/**
 * I 25 argomenti del programma ministeriale per l'esame teorico della patente B.
 */
export interface Chapter {
  id: number;
  title: string;
  short: string;
  emoji: string;
  color: string;
  colorDark: string;
}

const palette: [string, string][] = [
  ['#58CC02', '#58A700'],
  ['#1CB0F6', '#1899D6'],
  ['#CE82FF', '#A568CC'],
  ['#FF9600', '#CD7900'],
  ['#FF4B4B', '#EA2B2B'],
  ['#2B70C9', '#1F5AA6'],
  ['#00CD9C', '#00A47D'],
];

const raw: [string, string, string][] = [
  ['Definizioni generali e doveri nell’uso della strada', 'Definizioni', '🛣️'],
  ['Segnali di pericolo', 'Pericolo', '⚠️'],
  ['Segnali di divieto', 'Divieto', '⛔'],
  ['Segnali di obbligo', 'Obbligo', '🔵'],
  ['Segnali di precedenza', 'Precedenza', '🛑'],
  ['Segnaletica orizzontale e segni sugli ostacoli', 'Segnaletica orizzontale', '〰️'],
  ['Segnalazioni semaforiche e degli agenti del traffico', 'Semafori e agenti', '🚦'],
  ['Segnali di indicazione', 'Indicazione', '🪧'],
  ['Segnali complementari, temporanei e di cantiere', 'Cantieri', '🚧'],
  ['Pannelli integrativi dei segnali', 'Pannelli integrativi', '🔲'],
  ['Limiti di velocità, pericolo e intralcio alla circolazione', 'Velocità', '⏱️'],
  ['Distanza di sicurezza', 'Distanza di sicurezza', '↔️'],
  ['Norme sulla circolazione dei veicoli', 'Circolazione', '🚗'],
  ['Ordine di precedenza agli incroci', 'Incroci', '✖️'],
  ['Norme sul sorpasso', 'Sorpasso', '⏩'],
  ['Fermata, sosta, arresto e partenza', 'Fermata e sosta', '🅿️'],
  ['Norme varie: autostrade, traino, veicolo fermo, spie', 'Norme varie', '🛞'],
  ['Uso delle luci, dei dispositivi acustici e dei proiettori', 'Luci e clacson', '💡'],
  ['Cinture, sistemi di ritenuta per bambini e casco', 'Cinture e casco', '🪢'],
  ['Patenti, sanzioni, documenti e obblighi verso gli agenti', 'Patenti e sanzioni', '🪪'],
  ['Incidenti stradali e comportamento in caso di incidente', 'Incidenti', '🚑'],
  ['Condizioni fisiche e psichiche, alcol, droghe e primo soccorso', 'Alcol e salute', '🍷'],
  ['Responsabilità civile, penale e assicurazione', 'Assicurazione', '📄'],
  ['Consumi, ambiente e inquinamento', 'Ambiente', '🌱'],
  ['Elementi del veicolo, manutenzione e stabilità', 'Veicolo', '🔧'],
];

export const CHAPTERS: Chapter[] = raw.map(([title, short, emoji], i) => ({
  id: i + 1,
  title,
  short,
  emoji,
  color: palette[i % palette.length][0],
  colorDark: palette[i % palette.length][1],
}));

export const chapterById = (id: number) => CHAPTERS[id - 1];

/** Numero di lezioni (nodi del percorso) per ciascun capitolo. */
export const LESSONS_PER_CHAPTER = 4;
