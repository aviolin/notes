import { describe, it, expect } from 'vitest'
import type { Settings } from './types'
import { buildNotePool, buildChordPool } from './pool'
import { checkNoteName, checkChordName, checkKeyboard, chroma } from './answer'
import {
  noteNameChoices,
  chordNameChoices,
  chooseClef,
  weightedPick,
  nextQuestion,
} from './generator'

const baseSettings: Settings = {
  questionTypes: ['note-name', 'keyboard'],
  mode: 'notes',
  clefs: ['treble', 'bass'],
  noteLetters: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  accidentals: ['natural', 'sharp'],
  octaveRange: [4, 4],
  chordRoots: ['C', 'G'],
  chordQualities: ['major', 'minor'],
  inversions: [0],
  audioEnabled: false,
  strictSpelling: false,
  exactPitch: false,
  sessionLength: 10,
}

// Deterministic RNG cycling through given values.
function seededRng(values: number[]): () => number {
  let i = 0
  return () => values[i++ % values.length]
}

describe('pool', () => {
  it('expands single notes across letters/accidentals/octaves', () => {
    const pool = buildNotePool({
      ...baseSettings,
      noteLetters: ['C'],
      accidentals: ['natural', 'sharp'],
      octaveRange: [4, 5],
    })
    // C natural + C sharp across 2 octaves = 4 prompts
    expect(pool).toHaveLength(4)
    expect(pool.map((p) => p.spellings[0]).sort()).toEqual([
      'C#4',
      'C#5',
      'C4',
      'C5',
    ])
  })

  it('keeps C# and Db as distinct prompts (different reading)', () => {
    const pool = buildNotePool({
      ...baseSettings,
      noteLetters: ['C', 'D'],
      accidentals: ['sharp', 'flat'],
      octaveRange: [4, 4],
    })
    const names = pool.map((p) => p.noteName)
    expect(names).toContain('C#')
    expect(names).toContain('Db')
  })

  it('builds chords with correct pitch sets', () => {
    const pool = buildChordPool({
      ...baseSettings,
      mode: 'chords',
      chordRoots: ['C'],
      chordQualities: ['major'],
      octaveRange: [4, 4],
    })
    expect(pool).toHaveLength(1)
    expect(pool[0].spellings).toEqual(['C4', 'E4', 'G4'])
    expect(pool[0].chordName).toBe('C Major')
  })

  it('voices chord inversions by lifting lower notes an octave', () => {
    const pool = buildChordPool({
      ...baseSettings,
      mode: 'chords',
      chordRoots: ['C'],
      chordQualities: ['major'],
      octaveRange: [4, 4],
      inversions: [0, 1, 2],
    })
    const byInversion = Object.fromEntries(
      pool.map((p) => [p.inversion, p]),
    )
    // Root C E G, 1st inversion E G C, 2nd inversion G C E.
    expect(byInversion[0].midis).toEqual([60, 64, 67])
    expect(byInversion[1].midis).toEqual([64, 67, 72])
    expect(byInversion[2].midis).toEqual([67, 72, 76])
    expect(byInversion[1].spellings).toEqual(['E4', 'G4', 'C5'])
    // The chord name is unchanged across inversions.
    expect(byInversion[2].chordName).toBe('C Major')
  })

  it('skips inversions a chord has too few notes for', () => {
    const pool = buildChordPool({
      ...baseSettings,
      mode: 'chords',
      chordRoots: ['C'],
      chordQualities: ['major'],
      octaveRange: [4, 4],
      inversions: [3], // triads have no 3rd inversion
    })
    expect(pool).toHaveLength(0)
  })
})

describe('answer checking', () => {
  const cSharp = buildNotePool({
    ...baseSettings,
    noteLetters: ['C'],
    accidentals: ['sharp'],
    octaveRange: [4, 4],
  })[0]

  it('accepts enharmonic equivalents by default', () => {
    expect(checkNoteName(cSharp, 'C#').correct).toBe(true)
    expect(checkNoteName(cSharp, 'Db').correct).toBe(true)
    expect(checkNoteName(cSharp, 'D').correct).toBe(false)
  })

  it('rejects enharmonics in strict-spelling mode', () => {
    expect(checkNoteName(cSharp, 'C#', true).correct).toBe(true)
    expect(checkNoteName(cSharp, 'Db', true).correct).toBe(false)
  })

  it('matches keyboard answers by pitch class', () => {
    // Clicking C#5 (73) should satisfy a C#4 prompt (61).
    expect(checkKeyboard(cSharp, [73]).correct).toBe(true)
    expect(checkKeyboard(cSharp, [74]).correct).toBe(false)
  })

  it('requires exact pitches when exactPitch is set', () => {
    // C#4 is MIDI 61; the wrong-octave C#5 (73) is no longer accepted.
    expect(checkKeyboard(cSharp, [61], true).correct).toBe(true)
    expect(checkKeyboard(cSharp, [73], true).correct).toBe(false)
  })

  it('requires the exact set of chord tones on the keyboard', () => {
    const cMaj = buildChordPool({
      ...baseSettings,
      mode: 'chords',
      chordRoots: ['C'],
      chordQualities: ['major'],
      octaveRange: [4, 4],
    })[0]
    expect(checkKeyboard(cMaj, [60, 64, 67]).correct).toBe(true) // C E G
    expect(checkKeyboard(cMaj, [60, 64]).correct).toBe(false) // missing G
    expect(checkKeyboard(cMaj, [60, 64, 67, 62]).correct).toBe(false) // extra D
    expect(checkChordName(cMaj, 'C Major').correct).toBe(true)
    expect(checkChordName(cMaj, 'C Minor').correct).toBe(false)
  })

  it('exposes chroma with enharmonic equality', () => {
    expect(chroma('C#')).toBe(chroma('Db'))
  })
})

describe('generator', () => {
  const cSharp = buildNotePool({
    ...baseSettings,
    noteLetters: ['C'],
    accidentals: ['sharp'],
    octaveRange: [4, 4],
  })[0]

  it('produces 4 unique note-name choices including the answer', () => {
    const choices = noteNameChoices(cSharp, seededRng([0.1, 0.5, 0.9, 0.3]))
    expect(choices).toHaveLength(4)
    expect(new Set(choices).size).toBe(4)
    expect(choices).toContain('C#')
  })

  it('produces 4 chord-name choices including the answer', () => {
    const cMaj = buildChordPool({
      ...baseSettings,
      mode: 'chords',
      chordRoots: ['C'],
      chordQualities: ['major'],
      octaveRange: [4, 4],
    })[0]
    const choices = chordNameChoices(cMaj, baseSettings, seededRng([0.2, 0.7, 0.4, 0.1]))
    expect(choices).toHaveLength(4)
    expect(choices).toContain('C Major')
  })

  it('prefers the clef with fewest ledger lines', () => {
    const lowC = buildNotePool({
      ...baseSettings,
      noteLetters: ['C'],
      accidentals: ['natural'],
      octaveRange: [2, 2],
    })[0]
    expect(chooseClef(lowC, ['treble', 'bass'], Math.random)).toBe('bass')
    expect(chooseClef(cSharp, ['treble', 'bass'], Math.random)).toBe('treble')
  })

  it('weights weak spots higher', () => {
    const pool = buildNotePool({
      ...baseSettings,
      noteLetters: ['C', 'G'],
      accidentals: ['natural'],
      octaveRange: [4, 4],
    })
    // Heavily weight the G note; with rng just below 1 it should win.
    const weightFor = (key: string) => (key === 'note:G' ? 100 : 1)
    const chosen = weightedPick(pool, weightFor, () => 0.99)
    expect(chosen.noteName).toBe('G')
  })

  it('generates a complete note-name question', () => {
    const pool = buildNotePool(baseSettings)
    const q = nextQuestion(
      { ...baseSettings, questionTypes: ['note-name'] },
      pool,
      { rng: seededRng([0.05, 0.5, 0.3, 0.8, 0.1, 0.6]) },
    )
    expect(q.type).toBe('note-name')
    expect(q.choices).toHaveLength(4)
    expect(q.choices).toContain(q.answer)
  })

  it('throws on an empty pool', () => {
    expect(() => nextQuestion(baseSettings, [])).toThrow()
  })
})
