import type {
  Clef,
  Letter,
  Prompt,
  Question,
  QuestionType,
  Settings,
} from './types'
import { LETTERS } from './types'
import { qualityLabel } from './pool'

export interface GeneratorDeps {
  /** Relative draw weight for a prompt key; higher = more likely. Default 1. */
  weightFor?: (key: string) => number
  /** Injectable RNG in [0,1) for deterministic tests. */
  rng?: () => number
}

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const ALL_QUALITIES = ['major', 'minor', 'diminished', 'augmented']

function chromaOf(name: string): number {
  return SHARP_NAMES.indexOf(name) >= 0
    ? SHARP_NAMES.indexOf(name)
    : FLAT_NAMES.indexOf(name)
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Weighted random selection of a prompt using per-key weak-spot weights. */
export function weightedPick(
  pool: Prompt[],
  weightFor: (key: string) => number,
  rng: () => number,
): Prompt {
  const weights = pool.map((p) => Math.max(0.0001, weightFor(p.key)))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rng() * total
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]
    if (r <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

/** Choose a clef that displays the prompt with the fewest ledger lines. */
export function chooseClef(prompt: Prompt, clefs: Clef[], rng: () => number): Clef {
  if (clefs.length === 0) return 'treble'
  if (clefs.length === 1) return clefs[0]
  // Middle C (60) and above reads cleanly on treble, below on bass.
  const preferred: Clef = Math.min(...prompt.midis) >= 60 ? 'treble' : 'bass'
  return clefs.includes(preferred) ? preferred : pick(clefs, rng)
}

/** Build 4 shuffled note-name choices including the correct answer. */
export function noteNameChoices(prompt: Prompt, rng: () => number): string[] {
  const answer = prompt.noteName ?? ''
  const names = answer.includes('b') ? FLAT_NAMES : SHARP_NAMES
  const answerChroma = chromaOf(answer)
  const distractors = shuffle(
    names.filter((n) => chromaOf(n) !== answerChroma),
    rng,
  ).slice(0, 3)
  return shuffle([answer, ...distractors], rng)
}

/** Build 4 shuffled chord-name choices including the correct answer. */
export function chordNameChoices(
  prompt: Prompt,
  settings: Settings,
  rng: () => number,
): string[] {
  const answer = prompt.chordName ?? ''
  const roots: Letter[] =
    settings.chordRoots.length > 1 ? settings.chordRoots : [...LETTERS]
  const qualities =
    settings.chordQualities.length > 1 ? settings.chordQualities : ALL_QUALITIES
  const candidates = new Set<string>()
  for (const root of roots) {
    for (const quality of qualities) {
      candidates.add(`${root} ${qualityLabel(quality)}`)
    }
  }
  candidates.delete(answer)
  const distractors = shuffle([...candidates], rng).slice(0, 3)
  return shuffle([answer, ...distractors], rng)
}

let counter = 0

/** Produce the next question from a prebuilt prompt pool. */
export function nextQuestion(
  settings: Settings,
  pool: Prompt[],
  deps: GeneratorDeps = {},
): Question {
  if (pool.length === 0) {
    throw new Error('Cannot generate a question from an empty pool')
  }
  const rng = deps.rng ?? Math.random
  const weightFor = deps.weightFor ?? (() => 1)
  const prompt = weightedPick(pool, weightFor, rng)
  const clef = chooseClef(prompt, settings.clefs, rng)

  const types: QuestionType[] =
    settings.questionTypes.length > 0 ? settings.questionTypes : ['note-name']
  const type = pick(types, rng)

  const question: Question = {
    id: `q${counter++}`,
    type,
    prompt,
    clef,
  }

  if (type === 'note-name') {
    if (prompt.kind === 'chord') {
      question.choices = chordNameChoices(prompt, settings, rng)
      question.answer = prompt.chordName
    } else {
      question.choices = noteNameChoices(prompt, rng)
      question.answer = prompt.noteName
    }
  }
  return question
}
