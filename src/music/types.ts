// Core domain types — deliberately free of any React / rendering concerns so
// that question generation and answer checking can be unit tested in isolation.

export type Clef = 'treble' | 'bass'

export type QuestionType = 'note-name' | 'keyboard'

export type PracticeMode = 'notes' | 'chords'

export type Accidental = 'natural' | 'sharp' | 'flat'

/** The seven natural note letters. */
export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
export type Letter = (typeof LETTERS)[number]

/**
 * The musical content of a question, independent of how it's asked. A prompt is
 * either a single note or a chord; `midis` holds every sounding pitch (sorted)
 * so it can be rendered on a staff and played through the synth identically.
 */
export interface Prompt {
  kind: 'note' | 'chord'
  /** Sorted MIDI note numbers — one for a note, several for a chord. */
  midis: number[]
  /** Spelled note names with octave, e.g. ['C#4'] or ['C4','E4','G4']. */
  spellings: string[]
  // Single-note fields
  noteName?: string // pitch-class spelling, e.g. 'C#'
  // Chord fields
  chordSymbol?: string // tonal symbol, e.g. 'CM' / 'Am'
  chordName?: string // display name, e.g. 'C Major'
  rootName?: string
  quality?: string
  /** Voicing inversion: 0 = root position, 1 = 1st, etc. (chords only). */
  inversion?: number
  /** Stable identity used to key weak-spot stats. */
  key: string
}

export interface Question {
  id: string
  type: QuestionType
  prompt: Prompt
  clef: Clef
  /** Multiple-choice options (note-name questions only). */
  choices?: string[]
  /** Canonical correct answer label for multiple-choice questions. */
  answer?: string
}

export interface Settings {
  questionTypes: QuestionType[]
  mode: PracticeMode
  clefs: Clef[]
  // Single-note pool
  noteLetters: Letter[]
  accidentals: Accidental[]
  octaveRange: [number, number]
  // Chord pool
  chordRoots: Letter[]
  chordQualities: string[] // tonal chord type names, e.g. 'major', 'minor'
  /** Inversions to voice chords in: 0 = root position, 1 = 1st, 2 = 2nd, 3 = 3rd. */
  inversions: number[]
  // Behaviour
  audioEnabled: boolean
  strictSpelling: boolean
  /** Keyboard answers must match exact pitches (octave matters), not just pitch class. */
  exactPitch: boolean
  sessionLength: number
}

export interface AnswerResult {
  correct: boolean
  /** Canonical correct answer, for display on a wrong guess. */
  expected: string
}
