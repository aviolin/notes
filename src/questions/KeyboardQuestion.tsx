import { useState } from 'react'
import type { AnswerResult, Question } from '../music/types'
import { checkKeyboard } from '../music/answer'
import { Staff } from '../components/Staff'
import { PianoKeyboard } from '../components/PianoKeyboard'
import { useSettings } from '../store/settingsStore'
import { playNotes } from '../audio/piano'

interface Props {
  question: Question
  onComplete: (result: AnswerResult) => void
}

const chromaOf = (m: number) => ((m % 12) + 12) % 12
/** The octave number (e.g. 4 for C4) whose C-block contains this MIDI note. */
const octaveOf = (m: number) => Math.floor(m / 12) - 1

/** Default number of octaves shown when the notes fit within fewer. */
const DEFAULT_OCTAVES = 2

/**
 * Choose a keyboard span that covers every note in the prompt, defaulting to
 * the usual two octaves and only widening if a chord reaches further.
 */
function keyboardRange(midis: number[]): { baseOctave: number; octaves: number } {
  const noteOctaves = midis.map(octaveOf)
  const baseOctave = Math.min(...noteOctaves)
  const topOctave = Math.max(...noteOctaves)
  const octaves = Math.max(DEFAULT_OCTAVES, topOctave - baseOctave + 1)
  return { baseOctave, octaves }
}

/** Find-it-on-the-keyboard question: click the correct key(s) on the piano. */
export function KeyboardQuestion({ question, onComplete }: Props) {
  const [selected, setSelected] = useState<number[]>([])
  const [revealed, setRevealed] = useState(false)
  const audioEnabled = useSettings((s) => s.audioEnabled)
  const exactPitch = useSettings((s) => s.exactPitch)
  const isChord = question.prompt.kind === 'chord'
  const targetCount = question.prompt.midis.length

  const finish = (picks: number[]) => {
    const result = checkKeyboard(question.prompt, picks, exactPitch)
    setRevealed(true)
    void playNotes(question.prompt.midis, audioEnabled)
    onComplete(result)
  }

  const handleKey = (midi: number) => {
    if (revealed) return
    if (!isChord) {
      setSelected([midi])
      finish([midi])
      return
    }
    setSelected((prev) =>
      prev.includes(midi) ? prev.filter((m) => m !== midi) : [...prev, midi],
    )
  }

  const { baseOctave, octaves } = keyboardRange(question.prompt.midis)
  const targetMidis = question.prompt.midis
  const targetChromas = targetMidis.map(chromaOf)
  const wrongChromas = revealed
    ? selected.map(chromaOf).filter((c) => !targetChromas.includes(c))
    : []
  const wrongMidis = revealed
    ? selected.filter((m) => !targetMidis.includes(m))
    : []

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-slate-400">
        {isChord
          ? `Play the chord — select ${targetCount} keys`
          : 'Find the note on the keyboard'}
      </p>
      <div className="max-w-full overflow-x-auto rounded-xl bg-white p-2">
        <Staff spellings={question.prompt.spellings} clef={question.clef} />
      </div>
      <PianoKeyboard
        octaves={octaves}
        baseOctave={baseOctave}
        selectedMidis={selected}
        highlightChromas={revealed && !exactPitch ? targetChromas : []}
        wrongChromas={exactPitch ? [] : wrongChromas}
        highlightMidis={revealed && exactPitch ? targetMidis : []}
        wrongMidis={exactPitch ? wrongMidis : []}
        disabled={revealed}
        onKeyClick={handleKey}
      />
      {isChord && revealed && question.prompt.chordName && (
        <p className="text-slate-300">
          Chord: <span className="font-semibold text-white">{question.prompt.chordName}</span>
        </p>
      )}
      {isChord && !revealed && (
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={() => finish(selected)}
          className="rounded-lg bg-blue-600 px-6 py-2 font-semibold hover:bg-blue-500 disabled:opacity-40"
        >
          Submit ({selected.length}/{targetCount})
        </button>
      )}
    </div>
  )
}
