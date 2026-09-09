import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Aporte,
  Operation,
  ProjectionParams,
  Settings,
  Theme,
  View,
} from '../types';
import { uid } from './format';
import { sampleData } from './sample';

type State = {
  operations: Operation[];
  aportes: Aporte[];
  settings: Settings;
  projection: ProjectionParams;
  view: View;
  sidebarCollapsed: boolean;
};

type Actions = {
  addOperation: (op: Omit<Operation, 'id' | 'createdAt'>) => void;
  updateOperation: (id: string, patch: Partial<Operation>) => void;
  removeOperation: (id: string) => void;

  addAporte: (a: Omit<Aporte, 'id' | 'createdAt'>) => void;
  updateAporte: (id: string, patch: Partial<Aporte>) => void;
  removeAporte: (id: string) => void;

  setSettings: (patch: Partial<Settings>) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  setProjection: (patch: Partial<ProjectionParams>) => void;
  resetProjection: () => void;

  setView: (view: View) => void;
  toggleSidebar: () => void;

  loadSample: () => void;
  clearAll: () => void;
  importData: (data: Partial<State>) => void;
};

const defaultSettings: Settings = {
  theme: 'dark',
  monthlyGoal: 12000,
  currencyDisplay: 'symbol',
  startingBankroll: 0,
};

const defaultProjection: ProjectionParams = {
  bankroll: 50000,
  riskPerOp: 2,
  opsPerMonth: 250,
  winRate: 60,
  payout: 80,
  tradingDays: 22,
  compound: false,
};

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      operations: [],
      aportes: [],
      settings: defaultSettings,
      projection: defaultProjection,
      view: 'dashboard',
      sidebarCollapsed: false,

      addOperation: (op) =>
        set((s) => ({
          operations: [
            ...s.operations,
            { ...op, id: uid(), createdAt: new Date().toISOString() },
          ],
        })),
      updateOperation: (id, patch) =>
        set((s) => ({
          operations: s.operations.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        })),
      removeOperation: (id) =>
        set((s) => ({ operations: s.operations.filter((o) => o.id !== id) })),

      addAporte: (a) =>
        set((s) => ({
          aportes: [
            ...s.aportes,
            { ...a, id: uid(), createdAt: new Date().toISOString() },
          ],
        })),
      updateAporte: (id, patch) =>
        set((s) => ({
          aportes: s.aportes.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),
      removeAporte: (id) =>
        set((s) => ({ aportes: s.aportes.filter((a) => a.id !== id) })),

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),
      toggleTheme: () =>
        set((s) => ({
          settings: {
            ...s.settings,
            theme: s.settings.theme === 'dark' ? 'light' : 'dark',
          },
        })),

      setProjection: (patch) =>
        set((s) => ({ projection: { ...s.projection, ...patch } })),
      resetProjection: () => set({ projection: defaultProjection }),

      setView: (view) => set({ view }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      loadSample: () => {
        const { operations, aportes } = sampleData();
        set({ operations, aportes });
      },
      clearAll: () => set({ operations: [], aportes: [] }),
      importData: (data) =>
        set((s) => ({
          operations: Array.isArray(data.operations) ? data.operations : s.operations,
          aportes: Array.isArray(data.aportes) ? data.aportes : s.aportes,
          settings: data.settings ? { ...s.settings, ...data.settings } : s.settings,
          projection: data.projection
            ? { ...s.projection, ...data.projection }
            : s.projection,
        })),
    }),
    {
      name: 'daytrade-banca',
      version: 1,
      partialize: (s) => ({
        operations: s.operations,
        aportes: s.aportes,
        settings: s.settings,
        projection: s.projection,
        view: s.view,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    },
  ),
);
