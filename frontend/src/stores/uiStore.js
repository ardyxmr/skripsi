import { create } from 'zustand';

export const useUI = create((set) => ({
  darkMode: localStorage.getItem('theme') === 'dark',
  toggleDarkMode: () =>
    set((s) => {
      const next = !s.darkMode;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return { darkMode: next };
    }),

  sidebarCollapsed: localStorage.getItem('mainSidebarCollapsed') === 'true',
  toggleSidebar: () =>
    set((s) => {
      const next = !s.sidebarCollapsed;
      localStorage.setItem('mainSidebarCollapsed', String(next));
      return { sidebarCollapsed: next };
    }),

  toasts: [],
  pushToast: (t) =>
    set((s) => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), kind: 'success', ...t }] })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));
