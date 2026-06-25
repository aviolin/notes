import { Note, Chord } from '@tonaljs/tonal'
import type { Accidental, Letter, Prompt, Settings } from './types'

const ACCIDENTAL_SUFFIX: Record<Accidental, string> = {
  natural: '',
  sharp: '#',
  flat: 'b',
}

const DISPLAY_QUALITY: Record<string, string> = {
  major: 'Major',
  minor: 'Minor',
  diminished: 'Diminished',
  augmented: 'Augmented',
  dominant7: 'Dominant 7th',
  major7: 'Major 7th',
  minor7: 'Minor 7th',
}

/** Human-readable chord quality label, falling back to a title-cased name. */
export function qualityLabel(quality: string): string {
  return (
    DISPLAY_QUALITY[quality] ??
    quality.charAt(0).toUpperCase() + quality.slice(1)
  )
}

function octavesInRange([lo, hi]: [number, number]): number[] {
  const out: number[] = []
  for (let o = lo; o <= hi; o++) out.push(o)
  return out
}

/** A note paired with its MIDI number, used while voicing chords. */
interface Voice {
  name: string
  midi: number
}

/**
 * Re-voice a root-position chord (ascending) into the given inversion by
 * lifting the lowest `inversion` notes up an octave, then re-sorting.
 */
function applyInversion(base: Voice[], inversion: number): Voice[] {
  const voiced = base.map((v, i) => {
    if (i >= inversion) return v
    const name = Note.transpose(v.name, '8P')
    return { name, midi: Note.midi(name) ?? v.midi + 12 }
  })
  return voiced.sort((a, b) => a.midi - b.midi)
}

/** Build every concrete single-note prompt allowed by the settings. */
export function buildNotePool(settings: Settings): Prompt[] {
  const prompts: Prompt[] = []
  for (const letter of settings.noteLetters) {
    for (const accidental of settings.accidentals) {
      const pc = `${letter}${ACCIDENTAL_SUFFIX[accidental]}`
      for (const octave of octavesInRange(settings.octaveRange)) {
        const spelling = `${pc}${octave}`
        const midi = Note.midi(spelling)
        if (midi == null) continue
        // C# and Db are kept as distinct prompts: same pitch, different reading.
        prompts.push({
          kind: 'note',
          midis: [midi],
          spellings: [spelling],
          noteName: pc,
          key: `note:${pc}`,
        })
      }
    }
  }
  return prompts
}

/** Build every chord prompt allowed by the settings. */
export function buildChordPool(settings: Settings): Prompt[] {
  const prompts: Prompt[] = []
  const inversions = settings.inversions ?? []
  for (const root of settings.chordRoots) {
    for (const quality of settings.chordQualities) {
      for (const octave of octavesInRange(settings.octaveRange)) {
        const chord = Chord.getChord(quality, `${root}${octave}`)
        if (chord.empty || chord.notes.length === 0) continue
        const base: Voice[] = chord.notes
          .map((name) => ({ name, midi: Note.midi(name) }))
          .filter((v): v is Voice => v.midi != null)
          .sort((a, b) => a.midi - b.midi)
        if (base.length !== chord.notes.length) continue
        for (const inversion of inversions) {
          // An inversion needs a note to move below the rest; skip if too high.
          if (inversion >= base.length) continue
          const voices = applyInversion(base, inversion)
          prompts.push({
            kind: 'chord',
            midis: voices.map((v) => v.midi),
            spellings: voices.map((v) => v.name),
            chordSymbol: chord.symbol,
            chordName: `${root} ${qualityLabel(quality)}`,
            rootName: root,
            quality,
            inversion,
            key:
              inversion === 0
                ? `chord:${root}:${quality}`
                : `chord:${root}:${quality}:inv${inversion}`,
          })
        }
      }
    }
  }
  return prompts
}

export function buildPool(settings: Settings): Prompt[] {
  return settings.mode === 'chords'
    ? buildChordPool(settings)
    : buildNotePool(settings)
}

/** Distinct prompt identities present in the pool (used for stats display). */
export function poolKeys(prompts: Prompt[]): string[] {
  return Array.from(new Set(prompts.map((p) => p.key)))
}

export type { Letter }
