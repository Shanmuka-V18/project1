import { create } from 'zustand';

interface AppState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  isAiDrawerOpen: boolean;
  toggleAiDrawer: () => void;
  setAiDrawerOpen: (open: boolean) => void;
  unreadNotificationsCount: number;
  setUnreadNotificationsCount: (count: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  isAiDrawerOpen: false,
  toggleAiDrawer: () => set((state) => ({ isAiDrawerOpen: !state.isAiDrawerOpen })),
  setAiDrawerOpen: (open) => set({ isAiDrawerOpen: open }),
  unreadNotificationsCount: 0,
  setUnreadNotificationsCount: (count) => set({ unreadNotificationsCount: count }),
}));
