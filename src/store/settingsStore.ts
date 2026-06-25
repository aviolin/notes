import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LETTERS } from '../music/types'
import type { Settings } from '../music/types'

export const ALL_QUALITIES = [
  'major',
  'minor',
  'diminished',
  'augmented',
  'major7',
  'minor7',
  'dominant7',
] as const

/** Inversions a chord can be voiced in, with display labels. */
export const ALL_INVERSIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Root position' },
  { value: 1, label: '1st inversion' },
  { value: 2, label: '2nd inversion' },
  { value: 3, label: '3rd inversion' },
]

const DEFAULT_SETTINGS: Settings = {
  questionTypes: ['note-name', 'keyboard'],
  mode: 'notes',
  clefs: ['treble', 'bass'],
  noteLetters: [...LETTERS],
  accidentals: ['natural'],
  octaveRange: [4, 5],
  chordRoots: [...LETTERS],
  chordQualities: ['major', 'minor'],
  inversions: [0],
  audioEnabled: true,
  strictSpelling: false,
  exactPitch: false,
  sessionLength: 15,
}

interface SettingsState extends Settings {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  toggleInArray: <K extends keyof Settings>(key: K, value: unknown) => void
  reset: () => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      set: (key, value) => set({ [key]: value } as Partial<SettingsState>),
      toggleInArray: (key, value) =>
        set((state) => {
          const arr = state[key] as unknown[]
          const next = arr.includes(value)
            ? arr.filter((v) => v !== value)
            : [...arr, value]
          return { [key]: next } as Partial<SettingsState>
        }),
      reset: () => set({ ...DEFAULT_SETTINGS }),
    }),
    { name: 'piano-trainer-settings' },
  ),
)

/** Extract just the plain Settings fields (no actions) for the domain layer. */
export function toSettings(s: SettingsState): Settings {
  return {
    questionTypes: s.questionTypes,
    mode: s.mode,
    clefs: s.clefs,
    noteLetters: s.noteLetters,
    accidentals: s.accidentals,
    octaveRange: s.octaveRange,
    chordRoots: s.chordRoots,
    chordQualities: s.chordQualities,
    inversions: s.inversions,
    audioEnabled: s.audioEnabled,
    strictSpelling: s.strictSpelling,
    exactPitch: s.exactPitch,
    sessionLength: s.sessionLength,
  }
}
