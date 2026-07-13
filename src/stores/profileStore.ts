import { create } from 'zustand';
import { getProfile, saveProfile } from '../repositories/profileRepository';
import type { Profile } from '../models';

interface ProfileState {
  profile: Profile | null;
  /** true una vez que se intentó cargar el perfil desde SQLite. */
  loaded: boolean;
  load: () => Promise<void>;
  save: (profile: Profile) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loaded: false,

  load: async () => {
    const profile = await getProfile();
    set({ profile, loaded: true });
  },

  save: async (profile: Profile) => {
    await saveProfile(profile);
    set({ profile, loaded: true });
  },
}));
