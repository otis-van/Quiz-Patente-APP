import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DuoButton } from '@/components/DuoButton';
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.inner}>
          <View style={styles.top}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
            <Pressable onPress={() => setMode(signup ? 'signin' : 'signup')}>
              <Text style={styles.switch}>{signup ? 'ACCEDI' : 'REGISTRATI'}</Text>
            </Pressable>
          </View>

          <Text style={styles.title}>{signup ? 'Crea il tuo profilo' : 'Accedi'}</Text>
          <Text style={styles.subtitle}>
            {signup ? 'Salva i progressi e continua su tutti i tuoi dispositivi.' : 'Bentornato! Riprendi da dove avevi lasciato.'}
          </Text>

          <View style={styles.form}>
            {signup && (
              <TextInput
                style={[styles.input, styles.inputTop]}
                placeholder="Nome"
                placeholderTextColor={C.gray}
                value={name}
                onChangeText={setName}
                autoComplete="name"
              />
            )}
            <TextInput
              style={[styles.input, !signup && styles.inputTop]}
              placeholder="Email"
              placeholderTextColor={C.gray}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextInput
              style={[styles.input, styles.inputBottom]}
              placeholder="Password (min. 6 caratteri)"
              placeholderTextColor={C.gray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={signup ? 'new-password' : 'password'}
              onSubmitEditing={() => valid && submit()}
            />
          </View>

          {message && <Text style={styles.message}>{message}</Text>}

          <DuoButton
            title={loading ? 'Attendi…' : signup ? 'Crea profilo' : 'Accedi'}
            variant="blue"
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
  close: { fontSize: 24, color: C.gray, fontFamily: F.bold },
  switch: { fontFamily: F.black, color: C.blue, fontSize: 15, letterSpacing: 0.8 },
  title: { fontFamily: F.black, fontSize: 28, color: C.text, textAlign: 'center' },
  subtitle: { fontFamily: F.regular, fontSize: 16, color: C.textLight, textAlign: 'center', marginTop: 6 },
  form: { marginTop: 24, borderWidth: 2, borderColor: C.grayLight, borderRadius: 16, backgroundColor: C.grayBg },
  input: {
    fontFamily: F.regular,
    fontSize: 17,
    color: C.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 2,
    borderTopColor: C.grayLight,
  },
  inputTop: { borderTopWidth: 0 },
  inputBottom: {},
  message: { fontFamily: F.bold, color: C.redText, fontSize: 15, marginTop: 12, textAlign: 'center' },
  note: { fontFamily: F.regular, color: C.gray, fontSize: 13, textAlign: 'center', marginTop: 16 },
}));
