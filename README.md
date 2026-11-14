# 🚗 Quiz Patente B

App per prepararsi all'esame teorico della **patente B**, con un'esperienza ispirata a Duolingo:
percorso a livelli, XP, serie di giorni consecutivi, missioni giornaliere e simulazioni d'esame.
Funziona su **iOS, Android** (e web) ed è **sincronizzata tramite account**, così puoi iniziare
sul telefono e continuare sul tablet.

**Stile:** Y2K / neo-brutalista — sfondo crema (tema chiaro) o grigio (tema scuro), contorni neri
con ombre nette, accenti pastello, riquadri a "finestra" da vecchio sistema operativo, icone in
stile "sticker" vettoriale (`src/components/Icon.tsx`) e font Space Grotesk, Space Mono e Silkscreen.
All'apertura si apre una finestra "patente.exe" in stile vecchio sistema operativo (`src/components/IntroAnimation.tsx`, 4 varianti a caso) con un'auto in prospettiva (`PerspectiveCar.tsx`) di colore e su sfondo diversi a ogni apertura;
si salta con un tocco e si può disattivare dal Profilo. Jingle ed effetti sonori originali (sintetizzati, `assets/sounds`) si attivano/disattivano dal Profilo. Sul web `?intro=1..4` forza una variante.

## Funzionalità

| Sezione | Cosa contiene |
| --- | --- |
| 🏠 **Percorso** | I 25 argomenti del programma ministeriale come "unità" con 4 nodi ciascuna (3 lezioni + ripasso finale). Le domande sbagliate vengono riproposte a fine lezione, come in Duolingo. |
| 📅 **Oggi** | Missioni del giorno, **un esercizio giornaliero per ogni argomento** (5 domande che cambiano ogni giorno, uguali su tutti i dispositivi), allenamento rapido sui punti deboli e ripasso degli errori. |
| 📝 **Esame** | Simulazione fedele all'esame: 30 domande Vero/Falso da tutti gli argomenti, 20 minuti, idoneo con massimo 3 errori. Navigazione libera tra le domande, correzione finale e storico con indice di preparazione. |
| 👤 **Profilo** | Account e stato di sincronizzazione, statistiche, grafico XP settimanale, obiettivo giornaliero. |
| 📖 **Guida argomento** | Tutte le domande dell'argomento con risposta, spiegazione e livello di padronanza. |
| 🛑 **Segnali illustrati** | Oltre 70 segnali disegnati in SVG (pericolo, divieto, obbligo, precedenza, indicazione, pannelli, semafori, segnaletica orizzontale) mostrati nelle domande "Il segnale raffigurato…" e nel *Dizionario dei segnali*. |
| 🌙 **Tema scuro** | Automatico (segue il sistema), chiaro o scuro, da Profilo → Aspetto. |
| ⏰ **Promemoria** | Notifica giornaliera all'orario scelto (Profilo → Promemoria). Non arriva se l'obiettivo del giorno è già raggiunto e ricorda la serie da non perdere. |

## Tecnologie

- [Expo](https://expo.dev) SDK 58 + React Native + Expo Router (TypeScript)
- [Zustand](https://zustand.docs.pmnd.rs) con persistenza locale (AsyncStorage): l'app funziona anche offline
- [Supabase](https://supabase.com) per account (email/password) e sincronizzazione dei progressi

## Avvio rapido

```bash
npm install
npx expo start               # poi premi i (iOS), a (Android) o w (web), oppure scansiona il QR con Expo Go
```

## Configurare account e sincronizzazione (Supabase)

1. Crea un progetto gratuito su [supabase.com](https://supabase.com).
2. In **SQL Editor** esegui `supabase/migrations/0001_progress.sql` (crea la tabella `progress` con Row Level Security: ogni utente vede solo i propri dati).
3. Il progetto Supabase dell'app è già configurato nel file `.env` (URL e chiave *anon*, entrambi pubblici).
   Per usare un progetto diverso, in **Project Settings → API** copia *Project URL* e *anon public key* in `.env.local`, che ha la precedenza:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```
4. (Facoltativo) In **Authentication → Providers → Email** puoi disattivare "Confirm email" per far accedere subito gli utenti dopo la registrazione.

### Come funziona la sincronizzazione

I progressi sono salvati prima in locale e poi sincronizzati automaticamente (al login, al ritorno
nell'app e 2 secondi dopo ogni modifica). Il cloud e il dispositivo vengono **uniti** senza perdere dati
(`mergeProgress` in `src/store/progress.ts`): XP per giorno e lezioni completate prendono il valore massimo,
esercizi giornalieri ed esami vengono uniti, per ogni domanda vince il tentativo più recente.
Così si può studiare offline su due dispositivi e ritrovare tutto al successivo collegamento.

## Promemoria e notifiche

I promemoria sono notifiche locali (`expo-notifications`), quindi non serve alcun server: vengono
programmati sul dispositivo per i 14 giorni successivi e riprogrammati a ogni apertura dell'app
e dopo ogni sessione. Le notifiche programmate **non funzionano in Expo Go su Android**: per provarle
serve una development build (`npx eas-cli@latest build --profile development`).

## Pubblicare su App Store e Google Play

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform all --profile production
npx eas-cli@latest submit --platform all
```
Ricorda di impostare le variabili `EXPO_PUBLIC_SUPABASE_*` anche negli
[ambienti EAS](https://docs.expo.dev/eas/environment-variables/) e di sostituire icone e splash in `assets/`.

## Le domande

`src/data/questions.ts` contiene un set iniziale di ~270 domande Vero/Falso scritte a mano e
distribuite sui 25 argomenti ministeriali, con spiegazioni per i casi più insidiosi;
115 sono accompagnate da un segnale illustrato (campo `sign`, vedi `src/components/RoadSign.tsx`).

Per aggiungere un segnale basta aggiungere una voce a `SIGNS` in `RoadSign.tsx` (disegno SVG su una
griglia 100×100) e indicarne l'id nella domanda.
Il database ufficiale del Ministero conta circa 7.000 domande, molte con immagini dei segnali:
per un uso reale conviene caricare il database completo nello stesso formato
(`{ id, chapter, text, answer, explanation?, sign? }`). L'ID di ogni domanda deve restare stabile,
perché le statistiche sincronizzate fanno riferimento ad esso.

> ⚠️ Le domande sono a scopo di esercitazione e vanno verificate rispetto al listato ministeriale in vigore.

## Struttura

```
src/
  app/               schermate (Expo Router)
    (tabs)/          Percorso, Oggi, Esame, Profilo
    quiz.tsx         lezioni, esercizi del giorno, ripasso, allenamento
    exam-session.tsx simulazione d'esame
    auth.tsx         accesso / registrazione
    chapter/[id].tsx guida dell'argomento
    signs.tsx        dizionario dei segnali
  components/        UI Y2K (bottoni, finestre, icone pixel, nodi del percorso, barre) e segnali SVG
  data/              argomenti e banca domande
  lib/               logica quiz, sincronizzazione, Supabase, date
  store/             stato dei progressi e autenticazione
supabase/migrations/ schema del database
```

## Comandi utili

```bash
npx tsc --noEmit   # controllo dei tipi
npx eslint src     # lint
```
