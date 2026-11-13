import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RoadSign, SignId, SIGNS } from '@/components/RoadSign';
import { F, makeStyles, MAX_WIDTH } from '@/theme';

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
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.root}>
      <View style={[styles.inner, styles.top]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Indietro</Text>
        </Pressable>
        <Text style={styles.title}>Dizionario dei segnali</Text>
      </View>
      <ScrollView>
        <View style={[styles.inner, { padding: 16 }]}>
          {GROUPS.map((g) => (
            <View key={g.title} style={{ marginBottom: 24 }}>
              <Text style={styles.section}>{g.title}</Text>
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
  top: { padding: 16, borderBottomWidth: 2, borderBottomColor: C.grayLight, gap: 8 },
  back: { fontFamily: F.bold, color: C.blue, fontSize: 16 },
  title: { fontFamily: F.black, color: C.text, fontSize: 24 },
  section: { fontFamily: F.black, color: C.text, fontSize: 19, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderWidth: 2,
    borderColor: C.grayLight,
    borderRadius: 16,
  },
  name: { fontFamily: F.bold, color: C.textLight, fontSize: 12, textAlign: 'center' },
}));
