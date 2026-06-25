import { create } from 'zustand'

export interface HistoryEntry {
  key: string
  label: string
  correct: boolean
}

interface SessionState {
  total: number
  correct: number
  streak: number
  bestStreak: number
  history: HistoryEntry[]
  start: () => void
  record: (entry: HistoryEntry) => void
}

export const useSession = create<SessionState>((set) => ({
  total: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
  history: [],
  start: () =>
    set({ total: 0, correct: 0, streak: 0, bestStreak: 0, history: [] }),
  record: (entry) =>
    set((state) => {
      const streak = entry.correct ? state.streak + 1 : 0
      return {
        total: state.total + 1,
        correct: state.correct + (entry.correct ? 1 : 0),
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        history: [...state.history, entry],
      }
    }),
}))
