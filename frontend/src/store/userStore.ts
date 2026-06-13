import { create } from 'zustand';

interface User {
  username: string;
  fullname: string;
}

interface UserState {
  user: User;
  setUser: (user: User) => void;
  setUsername: (username: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: {
    username: 'test_user',
    fullname: 'Ran User', // You can change this default
  },
  setUser: (user) => set({ user }),
  setUsername: (username) => set((state) => ({ user: { ...state.user, username } })),
}));
