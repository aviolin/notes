import { LETTERS } from '../music/types'
import type { Letter } from '../music/types'
import {
  ALL_INVERSIONS,
  ALL_QUALITIES,
  toSettings,
  useSettings,
} from '../store/settingsStore'
import { buildPool, qualityLabel } from '../music/pool'

interface Props {
  onStart: () => void
  onViewHistory: () => void
}

function Toggle({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`touch-manipulation rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-blue-400 bg-blue-600 text-white'
          : 'border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

export function ConfigScreen({ onStart, onViewHistory }: Props) {
  const s = useSettings()
  const pool = buildPool(toSettings(s))
  const canStart = pool.length > 0 && s.questionTypes.length > 0

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 sm:gap-7 sm:p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Piano Note Trainer</h1>
          <p className="text-slate-400">Choose what to practice, then start.</p>
        </div>
        <button
          type="button"
          onClick={onViewHistory}
          className="shrink-0 touch-manipulation rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
        >
          History
        </button>
      </header>

      <Section title="Question types">
        <Toggle
          active={s.questionTypes.includes('note-name')}
          label="Name the note"
          onClick={() => s.toggleInArray('questionTypes', 'note-name')}
        />
        <Toggle
          active={s.questionTypes.includes('keyboard')}
          label="Find on keyboard"
          onClick={() => s.toggleInArray('questionTypes', 'keyboard')}
        />
      </Section>

      <Section title="Practice">
        <Toggle
          active={s.mode === 'notes'}
          label="Single notes"
          onClick={() => s.set('mode', 'notes')}
        />
        <Toggle
          active={s.mode === 'chords'}
          label="Chords"
          onClick={() => s.set('mode', 'chords')}
        />
      </Section>

      <Section title="Clefs">
        <Toggle
          active={s.clefs.includes('treble')}
          label="Treble 𝄞"
          onClick={() => s.toggleInArray('clefs', 'treble')}
        />
        <Toggle
          active={s.clefs.includes('bass')}
          label="Bass 𝄢"
          onClick={() => s.toggleInArray('clefs', 'bass')}
        />
      </Section>

      {s.mode === 'notes' ? (
        <>
          <Section title="Note names">
            {LETTERS.map((l) => (
              <Toggle
                key={l}
                active={s.noteLetters.includes(l)}
                label={l}
                onClick={() => s.toggleInArray('noteLetters', l)}
              />
            ))}
          </Section>
          <Section title="Accidentals">
            <Toggle
              active={s.accidentals.includes('natural')}
              label="♮ Natural"
              onClick={() => s.toggleInArray('accidentals', 'natural')}
            />
            <Toggle
              active={s.accidentals.includes('sharp')}
              label="♯ Sharp"
              onClick={() => s.toggleInArray('accidentals', 'sharp')}
            />
            <Toggle
              active={s.accidentals.includes('flat')}
              label="♭ Flat"
              onClick={() => s.toggleInArray('accidentals', 'flat')}
            />
          </Section>
        </>
      ) : (
        <>
          <Section title="Chord roots">
            {LETTERS.map((l) => (
              <Toggle
                key={l}
                active={s.chordRoots.includes(l)}
                label={l}
                onClick={() => s.toggleInArray('chordRoots', l)}
              />
            ))}
          </Section>
          <Section title="Chord qualities">
            {ALL_QUALITIES.map((q) => (
              <Toggle
                key={q}
                active={s.chordQualities.includes(q)}
                label={qualityLabel(q)}
                onClick={() => s.toggleInArray('chordQualities', q)}
              />
            ))}
          </Section>
          <Section title="Inversions">
            {ALL_INVERSIONS.map((inv) => (
              <Toggle
                key={inv.value}
                active={s.inversions.includes(inv.value)}
                label={inv.label}
                onClick={() => s.toggleInArray('inversions', inv.value)}
              />
            ))}
          </Section>
        </>
      )}

      <Section title="Octave range">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          From
          <select
            className="rounded bg-slate-800 px-2 py-1"
            value={s.octaveRange[0]}
            onChange={(e) =>
              s.set('octaveRange', [
                Number(e.target.value),
                Math.max(Number(e.target.value), s.octaveRange[1]),
              ])
            }
          >
            {[2, 3, 4, 5, 6].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          to
          <select
            className="rounded bg-slate-800 px-2 py-1"
            value={s.octaveRange[1]}
            onChange={(e) =>
              s.set('octaveRange', [
                Math.min(s.octaveRange[0], Number(e.target.value)),
                Number(e.target.value),
              ])
            }
          >
            {[2, 3, 4, 5, 6].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      </Section>

      <Section title="Options">
        <Toggle
          active={s.audioEnabled}
          label="🔊 Audio"
          onClick={() => s.set('audioEnabled', !s.audioEnabled)}
        />
        {s.mode === 'notes' && (
          <Toggle
            active={s.strictSpelling}
            label="Strict spelling (C♯ ≠ D♭)"
            onClick={() => s.set('strictSpelling', !s.strictSpelling)}
          />
        )}
        {s.questionTypes.includes('keyboard') && (
          <Toggle
            active={s.exactPitch}
            label="Require exact pitches"
            onClick={() => s.set('exactPitch', !s.exactPitch)}
          />
        )}
        <label className="flex items-center gap-2 text-sm text-slate-300">
          Questions
          <select
            className="rounded bg-slate-800 px-2 py-1"
            value={s.sessionLength}
            onChange={(e) => s.set('sessionLength', Number(e.target.value))}
          >
            {[5, 10, 15, 20, 30].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </Section>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
        <button
          type="button"
          disabled={!canStart}
          onClick={onStart}
          className="w-full rounded-lg bg-green-600 px-8 py-3 text-lg font-bold hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          Start practice
        </button>
        {!canStart && (
          <span className="text-sm text-red-400">
            Select at least one question type and one item to practice.
          </span>
        )}
        {canStart && (
          <span className="text-sm text-slate-500">
            {pool.length} items in pool
          </span>
        )}
      </div>
    </div>
  )
}

export type { Letter }
