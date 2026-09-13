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
import { supabase } from './supabase';
import { clearAllPhotos, removePhotos } from './storage';
import { sampleRows } from './sample';

type Status = 'idle' | 'loading' | 'ready' | 'error';

type State = {
  operations: Operation[];
  aportes: Aporte[];
  settings: Settings;
  projection: ProjectionParams;
  view: View;
  sidebarCollapsed: boolean;
  status: Status;
  error: string | null;
};

type Result = Promise<string | null>;

type Actions = {
  loadData: () => Promise<void>;

  addOperation: (op: Omit<Operation, 'id' | 'createdAt'>) => Result;
  updateOperation: (id: string, patch: Partial<Operation>) => Result;
  removeOperation: (id: string) => Result;

  addAporte: (a: Omit<Aporte, 'id' | 'createdAt'>) => Result;
  updateAporte: (id: string, patch: Partial<Aporte>) => Result;
  removeAporte: (id: string) => Result;

  setSettings: (patch: Partial<Pick<Settings, 'monthlyGoal' | 'startingBankroll' | 'currencyDisplay'>>) => Result;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  setProjection: (patch: Partial<ProjectionParams>) => void;
  resetProjection: () => void;

  setView: (view: View) => void;
  toggleSidebar: () => void;

  loadSample: () => Result;
  clearAll: () => Result;
  importData: (data: {
    operations?: unknown;
    aportes?: unknown;
    settings?: Partial<Settings>;
    projection?: Partial<ProjectionParams>;
  }) => Result;
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

/* ---- mapeamento linha do banco <-> objeto do app ---- */

type OpRow = {
  id: string;
  date: string;
  result: string | number;
  note: string | null;
  photos: string[] | null;
  created_at: string;
};
type ApRow = { id: string; date: string; amount: string | number; note: string | null; created_at: string };

const toOperation = (r: OpRow): Operation => ({
  id: r.id,
  date: r.date,
  result: Number(r.result),
  note: r.note ?? '',
  photos: r.photos ?? [],
  createdAt: r.created_at,
});
const toAporte = (r: ApRow): Aporte => ({
  id: r.id,
  date: r.date,
  amount: Number(r.amount),
  note: r.note ?? '',
  createdAt: r.created_at,
});

const msg = (e: unknown) =>
  e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Erro inesperado';

const sortOps = (a: { date: string; createdAt: string }, b: { date: string; createdAt: string }) =>
  a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date);

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      operations: [],
      aportes: [],
      settings: defaultSettings,
      projection: defaultProjection,
      view: 'dashboard',
      sidebarCollapsed: false,
      status: 'idle',
      error: null,

      loadData: async () => {
        set({ status: 'loading', error: null });
        try {
          const [ops, aps, cfg] = await Promise.all([
            supabase.from('operations').select('*').order('date', { ascending: true }),
            supabase.from('aportes').select('*').order('date', { ascending: true }),
            supabase.from('app_settings').select('*').eq('id', 1).maybeSingle(),
          ]);
          if (ops.error) throw ops.error;
          if (aps.error) throw aps.error;
          if (cfg.error) throw cfg.error;

          set((s) => ({
            operations: (ops.data as OpRow[]).map(toOperation).sort(sortOps),
            aportes: (aps.data as ApRow[]).map(toAporte).sort(sortOps),
            settings: {
              ...s.settings,
              monthlyGoal: cfg.data ? Number(cfg.data.monthly_goal) : s.settings.monthlyGoal,
              startingBankroll: cfg.data
                ? Number(cfg.data.starting_bankroll)
                : s.settings.startingBankroll,
              currencyDisplay: cfg.data?.currency_display ?? s.settings.currencyDisplay,
            },
            status: 'ready',
          }));
        } catch (e) {
          set({ status: 'error', error: msg(e) });
        }
      },

      addOperation: async (op) => {
        const { data, error } = await supabase
          .from('operations')
          .insert({ date: op.date, result: op.result, note: op.note ?? '', photos: op.photos ?? [] })
          .select()
          .single();
        if (error) return msg(error);
        set((s) => ({
          operations: [...s.operations, toOperation(data as OpRow)].sort(sortOps),
        }));
        return null;
      },
      updateOperation: async (id, patch) => {
        const row: Record<string, unknown> = {};
        if (patch.date !== undefined) row.date = patch.date;
        if (patch.result !== undefined) row.result = patch.result;
        if (patch.note !== undefined) row.note = patch.note;
        if (patch.photos !== undefined) row.photos = patch.photos;
        const { data, error } = await supabase
          .from('operations')
          .update(row)
          .eq('id', id)
          .select()
          .single();
        if (error) return msg(error);
        set((s) => ({
          operations: s.operations
            .map((o) => (o.id === id ? toOperation(data as OpRow) : o))
            .sort(sortOps),
        }));
        return null;
      },
      removeOperation: async (id) => {
        const photos = get().operations.find((o) => o.id === id)?.photos ?? [];
        const { error } = await supabase.from('operations').delete().eq('id', id);
        if (error) return msg(error);
        set((s) => ({ operations: s.operations.filter((o) => o.id !== id) }));
        if (photos.length) void removePhotos(photos);
        return null;
      },

      addAporte: async (a) => {
        const { data, error } = await supabase
          .from('aportes')
          .insert({ date: a.date, amount: a.amount, note: a.note ?? '' })
          .select()
          .single();
        if (error) return msg(error);
        set((s) => ({ aportes: [...s.aportes, toAporte(data as ApRow)].sort(sortOps) }));
        return null;
      },
      updateAporte: async (id, patch) => {
        const row: Record<string, unknown> = {};
        if (patch.date !== undefined) row.date = patch.date;
        if (patch.amount !== undefined) row.amount = patch.amount;
        if (patch.note !== undefined) row.note = patch.note;
        const { data, error } = await supabase
          .from('aportes')
          .update(row)
          .eq('id', id)
          .select()
          .single();
        if (error) return msg(error);
        set((s) => ({
          aportes: s.aportes
            .map((x) => (x.id === id ? toAporte(data as ApRow) : x))
            .sort(sortOps),
        }));
        return null;
      },
      removeAporte: async (id) => {
        const { error } = await supabase.from('aportes').delete().eq('id', id);
        if (error) return msg(error);
        set((s) => ({ aportes: s.aportes.filter((a) => a.id !== id) }));
        return null;
      },

      setSettings: async (patch) => {
        const row: Record<string, unknown> = {};
        if (patch.monthlyGoal !== undefined) row.monthly_goal = patch.monthlyGoal;
        if (patch.startingBankroll !== undefined) row.starting_bankroll = patch.startingBankroll;
        if (patch.currencyDisplay !== undefined) row.currency_display = patch.currencyDisplay;
        row.updated_at = new Date().toISOString();
        const { error } = await supabase.from('app_settings').update(row).eq('id', 1);
        if (error) return msg(error);
        set((s) => ({ settings: { ...s.settings, ...patch } }));
        return null;
      },
      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),
      toggleTheme: () =>
        set((s) => ({
          settings: {
            ...s.settings,
            theme: s.settings.theme === 'dark' ? 'light' : 'dark',
          },
        })),

      setProjection: (patch) => set((s) => ({ projection: { ...s.projection, ...patch } })),
      resetProjection: () => set({ projection: defaultProjection }),

      setView: (view) => set({ view }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      loadSample: async () => {
        const { operations, aportes } = sampleRows();
        const [o, a] = await Promise.all([
          supabase.from('operations').insert(operations).select(),
          supabase.from('aportes').insert(aportes).select(),
        ]);
        if (o.error) return msg(o.error);
        if (a.error) return msg(a.error);
        set((s) => ({
          operations: [...s.operations, ...(o.data as OpRow[]).map(toOperation)].sort(sortOps),
          aportes: [...s.aportes, ...(a.data as ApRow[]).map(toAporte)].sort(sortOps),
        }));
        return null;
      },
      clearAll: async () => {
        const epoch = '1970-01-01T00:00:00Z';
        const [o, a] = await Promise.all([
          supabase.from('operations').delete().gte('created_at', epoch),
          supabase.from('aportes').delete().gte('created_at', epoch),
        ]);
        if (o.error) return msg(o.error);
        if (a.error) return msg(a.error);
        set({ operations: [], aportes: [] });
        void clearAllPhotos();
        return null;
      },
      importData: async (data) => {
        const ops = Array.isArray(data.operations)
          ? (data.operations as Operation[]).map((o) => ({
              date: o.date,
              result: Number(o.result),
              note: o.note ?? '',
              photos: Array.isArray(o.photos) ? o.photos : [],
            }))
          : [];
        const aps = Array.isArray(data.aportes)
          ? (data.aportes as Aporte[]).map((a) => ({
              date: a.date,
              amount: Number(a.amount),
              note: a.note ?? '',
            }))
          : [];
        if (ops.length) {
          const { error } = await supabase.from('operations').insert(ops);
          if (error) return msg(error);
        }
        if (aps.length) {
          const { error } = await supabase.from('aportes').insert(aps);
          if (error) return msg(error);
        }
        if (data.projection) get().setProjection(data.projection);
        if (data.settings) {
          const err = await get().setSettings({
            monthlyGoal: data.settings.monthlyGoal,
            startingBankroll: data.settings.startingBankroll,
            currencyDisplay: data.settings.currencyDisplay,
          });
          if (err) return err;
        }
        await get().loadData();
        return null;
      },
    }),
    {
      name: 'daytrade-banca',
      version: 2,
      // Só preferências de UI ficam no navegador. Os dados moram no Supabase.
      partialize: (s) => ({
        settings: { theme: s.settings.theme },
        projection: s.projection,
        view: s.view,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return {
          ...current,
          ...p,
          settings: { ...current.settings, ...(p.settings ?? {}) },
          projection: { ...current.projection, ...(p.projection ?? {}) },
        };
      },
    },
  ),
);
