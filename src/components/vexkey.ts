// Convert a tonal spelling like 'C#4' / 'Eb4' into VexFlow's key + accidental.

export interface VexKey {
  key: string // e.g. 'c#/4'
  accidental: string | null // '#', 'b', 'bb', '##', or null
}

export function toVexKey(spelling: string): VexKey {
  const m = spelling.match(/^([A-Ga-g])(#{1,2}|b{1,2})?(-?\d+)$/)
  if (!m) return { key: spelling.toLowerCase(), accidental: null }
  const [, letter, acc, octave] = m
  return {
    key: `${letter.toLowerCase()}${acc ?? ''}/${octave}`,
    accidental: acc ?? null,
  }
}
