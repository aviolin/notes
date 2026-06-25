import { Note } from '@tonaljs/tonal'
import type { AnswerResult, Prompt } from './types'

/** Pitch-class number 0–11 for a spelled note or pitch class (C#≡Db≡1). */
export function chroma(name: string): number | null {
  const c = Note.chroma(name)
  return Number.isFinite(c) ? c : null
}

/** Set of pitch classes (mod 12) sounding in a prompt. */
function promptChromas(prompt: Prompt): Set<number> {
  return new Set(prompt.midis.map((m) => ((m % 12) + 12) % 12))
}

/**
 * Check a multiple-choice note-name answer. By default C# and Db are both
 * accepted (enharmonic equivalence); with `strictSpelling` the chosen label
 * must match the prompt's spelling exactly.
 */
export function checkNoteName(
  prompt: Prompt,
  picked: string,
  strictSpelling = false,
): AnswerResult {
  const expected = prompt.noteName ?? ''
  if (strictSpelling) {
    return { correct: picked === expected, expected }
  }
  const a = chroma(picked)
  const b = chroma(expected)
  return { correct: a != null && a === b, expected }
}

/** Check a multiple-choice chord-name answer (exact name match). */
export function checkChordName(prompt: Prompt, picked: string): AnswerResult {
  const expected = prompt.chordName ?? ''
  return { correct: picked === expected, expected }
}

/** True iff two number sets contain exactly the same members. */
function sameSet(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false
  for (const x of a) if (!b.has(x)) return false
  return true
}

/**
 * Check a keyboard answer. By default answers are judged by pitch class: the
 * selected keys must form exactly the prompt's set of pitch classes. With
 * `exactPitch`, the exact MIDI pitches must match (so octave matters).
 */
export function checkKeyboard(
  prompt: Prompt,
  selectedMidis: number[],
  exactPitch = false,
): AnswerResult {
  const expected =
    prompt.kind === 'chord'
      ? (prompt.chordName ?? '')
      : (prompt.noteName ?? '')
  if (exactPitch) {
    const target = new Set(prompt.midis)
    const picked = new Set(selectedMidis)
    return { correct: sameSet(picked, target), expected }
  }
  const target = promptChromas(prompt)
  const picked = new Set(selectedMidis.map((m) => ((m % 12) + 12) % 12))
  return { correct: sameSet(picked, target), expected }
}
