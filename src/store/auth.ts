import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

interface AuthState {
  session: Session | null;
  ready: boolean;
  init: () => () => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, name: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const translate = (msg: string) => {
  if (/invalid login/i.test(msg)) return 'Email o password non corretti.';
  if (/already registered/i.test(msg)) return 'Esiste già un account con questa email.';
  if (/password should be/i.test(msg)) return 'La password deve avere almeno 6 caratteri.';
  if (/email not confirmed/i.test(msg)) return 'Conferma la tua email tramite il link che ti abbiamo inviato.';
  return msg;
};

export const useAuth = create<AuthState>()((set) => ({
  session: null,
  ready: !supabase,
  init: () => {
    if (!supabase) return () => {};
    supabase.auth.getSession().then(({ data }) => set({ session: data.session, ready: true }));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => set({ session }));
    return () => data.subscription.unsubscribe();
  },
  signIn: async (email, password) => {
    if (!supabase) return 'Sincronizzazione non configurata.';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? translate(error.message) : null;
  },
  signUp: async (email, password, name) => {
    if (!supabase) return 'Sincronizzazione non configurata.';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    if (error) return translate(error.message);
    if (!data.session) return 'Ti abbiamo inviato un’email: conferma l’indirizzo e poi accedi.';
    return null;
  },
  signOut: async () => {
    await supabase?.auth.signOut();
  },
}));

export const displayName = (s: Session | null) =>
  (s?.user.user_metadata?.display_name as string | undefined) || s?.user.email?.split('@')[0] || 'Ospite';
