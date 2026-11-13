import { create } from 'zustand';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import { mergeProgress, pickData, ProgressData, useProgress } from '@/store/progress';

type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error' | 'offline';

export const useSyncStatus = create<{ status: SyncStatus; lastSync: number | null; error?: string }>(() => ({
  status: 'idle',
  lastSync: null,
}));

let running: Promise<void> | null = null;
let pending = false;

/**
 * Sincronizzazione: scarica i progressi dal cloud, li unisce a quelli locali
 * (mergeProgress non perde mai dati) e carica il risultato.
 */
export function syncNow(): Promise<void> {
  if (running) {
    pending = true;
    return running;
  }
  running = doSync().finally(() => {
    running = null;
    if (pending) {
      pending = false;
      void syncNow();
    }
  });
  return running;
}

async function doSync() {
  const session = useAuth.getState().session;
  if (!supabase || !session) {
    useSyncStatus.setState({ status: 'offline' });
    return;
  }
  useSyncStatus.setState({ status: 'syncing' });
  try {
    const userId = session.user.id;
    const { data: row, error } = await supabase
      .from('progress')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;

    const local = pickData(useProgress.getState());
    const merged = row?.data ? mergeProgress(local, row.data as ProgressData) : local;
    useProgress.getState().replaceData(merged);

    const { error: upErr } = await supabase
      .from('progress')
      .upsert({ user_id: userId, data: merged, updated_at: new Date().toISOString() });
    if (upErr) throw upErr;
    useSyncStatus.setState({ status: 'ok', lastSync: Date.now(), error: undefined });
  } catch (e) {
    useSyncStatus.setState({ status: 'error', error: e instanceof Error ? e.message : String(e) });
  }
}

let timer: ReturnType<typeof setTimeout> | undefined;

/** Avvia la sincronizzazione automatica: al login e (con debounce) a ogni modifica dei progressi. */
export function startAutoSync(): () => void {
  const unsubAuth = useAuth.subscribe((s, prev) => {
    if (s.session?.user.id && s.session.user.id !== prev.session?.user.id) void syncNow();
  });
  const unsubProgress = useProgress.subscribe((s, prev) => {
    if (s.updatedAt !== prev.updatedAt) {
      clearTimeout(timer);
      timer = setTimeout(() => void syncNow(), 2000);
    }
  });
  if (useAuth.getState().session) void syncNow();
  return () => {
    unsubAuth();
    unsubProgress();
    clearTimeout(timer);
  };
}
