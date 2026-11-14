import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GridBackground } from '@/components/GridBackground';
import { Icon } from '@/components/Icon';
import { RetroButton } from '@/components/RetroButton';
import { Window } from '@/components/Window';
import { useAuth } from '@/store/auth';
import { F, makeStyles, useColors } from '@/theme';

export default function AuthScreen() {
  const C = useColors();
  const styles = useStyles();
  const params = useLocalSearchParams<{ mode?: 'signin' | 'signup' }>();
  const [mode, setMode] = useState<'signin' | 'signup'>(params.mode ?? 'signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const signup = mode === 'signup';
  const valid = /\S+@\S+\.\S+/.test(email) && password.length >= 6 && (!signup || name.trim().length > 0);

  async function submit() {
    setLoading(true);
    setMessage(null);
    const { signIn, signUp } = useAuth.getState();
    const err = signup ? await signUp(email.trim(), password, name.trim()) : await signIn(email.trim(), password);
    setLoading(false);
    if (err) setMessage(err);
    else router.back();
  }

  return (
    <SafeAreaView style={styles.root}>
      <GridBackground />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.inner}>
          <View style={styles.top}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Icon name="close" size={26} />
            </Pressable>
            <Pressable onPress={() => setMode(signup ? 'signin' : 'signup')}>
              <Text style={styles.switch}>{signup ? 'ACCEDI' : 'REGISTRATI'}</Text>
            </Pressable>
          </View>

          <Text style={styles.title}>{signup ? 'Crea il tuo profilo' : 'Accedi'}</Text>
          <Text style={styles.subtitle}>
            {signup ? 'Salva i progressi e continua su tutti i tuoi dispositivi.' : 'Bentornato! Riprendi da dove avevi lasciato.'}
          </Text>

          <Window title={signup ? 'nuovo_utente.exe' : 'login.exe'} color={C.lilac} style={{ marginTop: 24 }} bodyStyle={styles.form}>
            {signup && (
              <TextInput
                style={[styles.input, styles.inputTop]}
                placeholder="Nome"
                placeholderTextColor={C.muted}
                value={name}
                onChangeText={setName}
                autoComplete="name"
              />
            )}
            <TextInput
              style={[styles.input, !signup && styles.inputTop]}
              placeholder="Email"
              placeholderTextColor={C.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextInput
              style={[styles.input, styles.inputBottom]}
              placeholder="Password (min. 6 caratteri)"
              placeholderTextColor={C.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={signup ? 'new-password' : 'password'}
              onSubmitEditing={() => valid && submit()}
            />
          </Window>

          {message && <Text style={styles.message}>{message}</Text>}

          <RetroButton
            title={loading ? 'Attendi…' : signup ? 'Crea profilo' : 'Accedi'}
            variant="yellow"
            disabled={!valid || loading}
            onPress={submit}
            style={{ marginTop: 20 }}
          />
          <Text style={styles.note}>
            I progressi fatti finora su questo dispositivo verranno uniti a quelli del tuo account.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((C) => ({
  root: { flex: 1, backgroundColor: C.bg },
  inner: { width: '100%', maxWidth: 480, alignSelf: 'center', padding: 20 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  switch: { fontFamily: F.pixel, color: C.text, fontSize: 14, textDecorationLine: 'underline' },
  title: { fontFamily: F.black, fontSize: 26, color: C.text, textAlign: 'center' },
  subtitle: { fontFamily: F.regular, fontSize: 16, color: C.textLight, textAlign: 'center', marginTop: 6 },
  form: { gap: 10 },
  input: {
    fontFamily: F.mono,
    fontSize: 16,
    color: C.text,
    backgroundColor: C.bg,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputTop: {},
  inputBottom: {},
  message: { fontFamily: F.bold, color: C.redText, fontSize: 15, marginTop: 14, textAlign: 'center' },
  note: { fontFamily: F.regular, color: C.muted, fontSize: 13, textAlign: 'center', marginTop: 18 },
}));
