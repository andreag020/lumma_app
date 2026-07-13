import { create } from 'zustand';
import { getEntryByDate, upsertEntry } from '../repositories/entryRepository';
import type { DailyEntry } from '../models';

interface EntryState {
  /** Registro de la fecha cargada más recientemente (normalmente hoy). */
  entry: DailyEntry | null;
  loaded: boolean;
  loadByDate: (date: string) => Promise<void>;
  save: (entry: DailyEntry) => Promise<void>;
}

export const useEntryStore = create<EntryState>((set) => ({
  entry: null,
  loaded: false,

  loadByDate: async (date: string) => {
    const entry = await getEntryByDate(date);
    set({ entry, loaded: true });
  },

  save: async (entry: DailyEntry) => {
    await upsertEntry(entry);
    set({ entry, loaded: true });
  },
}));
