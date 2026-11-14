import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GridBackground } from '@/components/GridBackground';
import { Icon } from '@/components/Icon';
import { RoadSign, SignId, SIGNS } from '@/components/RoadSign';
import { boxed, F, makeStyles, MAX_WIDTH } from '@/theme';
import { useOpenSound } from '@/lib/sounds';

const GROUPS: { title: string; ids: SignId[] }[] = [
  { title: 'Pericolo', ids: ['curva_dx', 'curva_sx', 'doppia_curva_dx', 'dosso', 'strettoia', 'semaforo_pericolo', 'incrocio_dx', 'pl_barriere', 'pl_senza', 'sdrucciolevole', 'bambini', 'discesa', 'altri_pericoli', 'lavori'] },
  { title: 'Precedenza', ids: ['dare_precedenza', 'stop', 'diritto_precedenza', 'fine_diritto', 'incrocio_precedenza'] },
  { title: 'Divieto', ids: ['divieto_transito', 'senso_vietato', 'divieto_sorpasso', 'fine_sorpasso', 'limite_50', 'fine_limite_50', 'divieto_sosta', 'divieto_fermata', 'divieto_acustiche', 'divieto_svolta_dx', 'divieto_inversione', 'via_libera'] },
  { title: 'Obbligo', ids: ['dir_dritto', 'dir_destra', 'dir_sinistra', 'passaggio_dx', 'passaggio_sx', 'rotatoria', 'limite_minimo_30', 'catene', 'pedonale', 'ciclabile'] },
  { title: 'Indicazione', ids: ['inizio_centro', 'fine_centro', 'inizio_autostrada', 'dir_autostrada', 'dir_extraurbana', 'dir_urbana', 'turistico', 'senza_uscita', 'ospedale', 'parcheggio'] },
  { title: 'Pannelli integrativi', ids: ['pannello_distanza', 'pannello_estesa', 'pannello_orario', 'pannello_rimozione'] },
  { title: 'Semafori', ids: ['semaforo_rosso', 'semaforo_giallo', 'semaforo_verde'] },
  { title: 'Segnaletica orizzontale', ids: ['striscia_continua', 'striscia_discontinua', 'striscia_mista', 'strisce_pedonali', 'linea_arresto', 'stalli_blu', 'isola_zebrata'] },
];

/** Dizionario illustrato dei segnali. */
export default function SignsScreen() {
  useOpenSound();
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.root}>
      <GridBackground />
      <View style={styles.topWrap}>
        <View style={[styles.inner, styles.top]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backRow} accessibilityLabel="Indietro">
            <Icon name="arrow" size={20} />
            <Text style={styles.back}>INDIETRO</Text>
          </Pressable>
          <Text style={styles.title}>Dizionario dei segnali</Text>
        </View>
      </View>
      <ScrollView>
        <View style={[styles.inner, { padding: 16 }]}>
          {GROUPS.map((g) => (
            <View key={g.title} style={{ marginBottom: 24 }}>
              <View style={styles.sectionBox}>
                <Text style={styles.section}>{g.title}</Text>
              </View>
              <View style={styles.grid}>
                {g.ids.map((id) => (
                  <View key={id} style={styles.cell}>
                    <RoadSign id={id} size={84} />
                    <Text style={styles.name}>{SIGNS[id].name}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((C) => ({
  root: { flex: 1, backgroundColor: C.bg },
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  topWrap: { borderBottomWidth: 2, borderBottomColor: C.ink, backgroundColor: C.surface },
  top: { padding: 16, gap: 10 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  back: { fontFamily: F.pixel, color: C.text, fontSize: 13 },
  title: { fontFamily: F.black, color: C.text, fontSize: 24 },
  sectionBox: {
    alignSelf: 'flex-start',
    backgroundColor: C.yellow,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 12,
  },
  section: { fontFamily: F.pixel, color: C.onAccent, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: {
    ...boxed(C, 3),
    width: '30%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 6,
    padding: 10,
    backgroundColor: C.surface,
  },
  name: { fontFamily: F.bold, color: C.textLight, fontSize: 12, textAlign: 'center' },
}));
