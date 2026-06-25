interface KeyDef {
  midi: number
  isBlack: boolean
  x: number
}

const WHITE_SEMITONES = [0, 2, 4, 5, 7, 9, 11]
// Black keys sit after these white-key indices, with their semitone offset.
const BLACKS: { afterWhite: number; semitone: number }[] = [
  { afterWhite: 0, semitone: 1 },
  { afterWhite: 1, semitone: 3 },
  { afterWhite: 3, semitone: 6 },
  { afterWhite: 4, semitone: 8 },
  { afterWhite: 5, semitone: 10 },
]

const WK_W = 44
const WK_H = 180
const BK_W = 28
const BK_H = 112

function buildKeys(octaves: number, baseOctave: number): KeyDef[] {
  const keys: KeyDef[] = []
  for (let o = 0; o < octaves; o++) {
    const baseMidi = (baseOctave + o + 1) * 12 // C of this octave
    WHITE_SEMITONES.forEach((semi, i) => {
      keys.push({
        midi: baseMidi + semi,
        isBlack: false,
        x: (o * 7 + i) * WK_W,
      })
    })
    BLACKS.forEach((b) => {
      keys.push({
        midi: baseMidi + b.semitone,
        isBlack: true,
        x: (o * 7 + b.afterWhite + 1) * WK_W - BK_W / 2,
      })
    })
  }
  return keys
}

const chromaOf = (midi: number) => ((midi % 12) + 12) % 12
/** The octave number (e.g. 4 for C4) that this MIDI note belongs to. */
const octaveOf = (midi: number) => Math.floor(midi / 12) - 1

interface PianoKeyboardProps {
  octaves?: number
  baseOctave?: number
  /** MIDI numbers the user has currently selected. */
  selectedMidis: number[]
  /** Pitch classes (0–11) to highlight as the correct answer, after reveal. */
  highlightChromas?: number[]
  /** Pitch classes the user selected that were wrong, shown in red. */
  wrongChromas?: number[]
  /** Exact MIDI pitches to highlight as the correct answer, after reveal. */
  highlightMidis?: number[]
  /** Exact MIDI pitches the user selected that were wrong, shown in red. */
  wrongMidis?: number[]
  disabled?: boolean
  onKeyClick: (midi: number) => void
}

export function PianoKeyboard({
  octaves = 2,
  baseOctave = 4,
  selectedMidis,
  highlightChromas = [],
  wrongChromas = [],
  highlightMidis = [],
  wrongMidis = [],
  disabled = false,
  onKeyClick,
}: PianoKeyboardProps) {
  const keys = buildKeys(octaves, baseOctave)
  const selected = new Set(selectedMidis)
  const highlight = new Set(highlightChromas)
  const wrong = new Set(wrongChromas)
  const highlightMidi = new Set(highlightMidis)
  const wrongMidi = new Set(wrongMidis)
  const totalWidth = octaves * 7 * WK_W

  const fill = (k: KeyDef): string => {
    if (highlightMidi.has(k.midi) || highlight.has(chromaOf(k.midi)))
      return '#22c55e' // correct answer
    if (selected.has(k.midi)) {
      return wrongMidi.has(k.midi) || wrong.has(chromaOf(k.midi))
        ? '#ef4444'
        : '#3b82f6'
    }
    return k.isBlack ? '#1e293b' : '#f8fafc'
  }

  const renderKey = (k: KeyDef) => (
    <g key={k.midi}>
      <rect
        role="button"
        aria-label={`piano-key-${k.midi}`}
        data-testid={`key-${k.midi}`}
        x={k.x}
        y={0}
        width={k.isBlack ? BK_W : WK_W}
        height={k.isBlack ? BK_H : WK_H}
        rx={4}
        fill={fill(k)}
        stroke="#0f172a"
        strokeWidth={1}
        style={{ cursor: disabled ? 'default' : 'pointer' }}
        onClick={() => !disabled && onKeyClick(k.midi)}
      />
      {!k.isBlack && chromaOf(k.midi) === 0 && (
        <text
          x={k.x + WK_W / 2}
          y={WK_H - 12}
          textAnchor="middle"
          fontSize={10}
          fontWeight="bold"
          fill="#475569"
          pointerEvents="none"
        >
          {`C${octaveOf(k.midi)}`}
        </text>
      )}
    </g>
  )

  return (
    <svg
      width={totalWidth}
      height={WK_H}
      viewBox={`0 0 ${totalWidth} ${WK_H}`}
      className="h-auto max-w-full touch-manipulation select-none"
    >
      {/* White keys first so black keys overlay them. */}
      {keys.filter((k) => !k.isBlack).map(renderKey)}
      {keys.filter((k) => k.isBlack).map(renderKey)}
    </svg>
  )
}
