import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StatRecord {
  seen: number
  correct: number
}

interface StatsState {
  byKey: Record<string, StatRecord>
  record: (key: string, correct: boolean) => void
  /** Draw weight for the weak-spot generator: unseen and missed items recur. */
  weightFor: (key: string) => number
  clear: () => void
}

export const useStats = create<StatsState>()(
  persist(
    (set, get) => ({
      byKey: {},
      record: (key, correct) =>
        set((state) => {
          const prev = state.byKey[key] ?? { seen: 0, correct: 0 }
          return {
            byKey: {
              ...state.byKey,
              [key]: {
                seen: prev.seen + 1,
                correct: prev.correct + (correct ? 1 : 0),
              },
            },
          }
        }),
      weightFor: (key) => {
        const rec = get().byKey[key]
        if (!rec || rec.seen === 0) return 1.5 // surface unseen items
        const accuracy = rec.correct / rec.seen
        return 0.5 + (1 - accuracy) * 3.5 // 0.5 (mastered) … 4.0 (always missed)
      },
      clear: () => set({ byKey: {} }),
    }),
    { name: 'piano-trainer-stats' },
  ),
)
