import { create } from 'zustand';

interface User {
  username: string;
}

interface UserState {
  user: User;
  setUser: (user: User) => void;
  setUsername: (username: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: {
    username: 'test1_user',
  },
  setUser: (user) => set({ user }),
  setUsername: (username) => set((state) => ({ user: { ...state.user, username } })),
}));
