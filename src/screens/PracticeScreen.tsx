import { useCallback, useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import type { AnswerResult, Question } from '../music/types'
import { buildPool } from '../music/pool'
import { nextQuestion } from '../music/generator'
import { toSettings, useSettings } from '../store/settingsStore'
import { useStats } from '../store/statsStore'
import { useSession } from '../store/sessionStore'
import { NoteNameQuestion } from '../questions/NoteNameQuestion'
import { KeyboardQuestion } from '../questions/KeyboardQuestion'

interface Props {
  onFinish: () => void
  onQuit: () => void
}

export function PracticeScreen({ onFinish, onQuit }: Props) {
  const settings = useSettings(useShallow(toSettings))
  const weightFor = useStats((s) => s.weightFor)
  const recordStat = useStats((s) => s.record)
  const session = useSession()
  const startSession = useSession((s) => s.start)
  const recordSession = useSession((s) => s.record)

  const pool = useMemo(() => buildPool(settings), [settings])

  const draw = useCallback(
    () => nextQuestion(settings, pool, { weightFor }),
    [settings, pool, weightFor],
  )

  const [question, setQuestion] = useState<Question | null>(null)
  const [answered, setAnswered] = useState<AnswerResult | null>(null)

  // Initialise the session once on mount.
  useEffect(() => {
    startSession()
    setQuestion(pool.length > 0 ? draw() : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleComplete = (result: AnswerResult) => {
    if (!question) return
    setAnswered(result)
    recordStat(question.prompt.key, result.correct)
    recordSession({
      key: question.prompt.key,
      label:
        question.prompt.chordName ?? question.prompt.noteName ?? question.prompt.key,
      correct: result.correct,
    })
  }

  const advance = () => {
    if (session.total >= settings.sessionLength) {
      onFinish()
      return
    }
    setAnswered(null)
    setQuestion(draw())
  }

  if (!question) {
    return (
      <div className="p-8 text-center text-slate-400">
        Nothing to practice. <button className="underline" onClick={onQuit}>Go back</button>.
      </div>
    )
  }

  const accuracy =
    session.total > 0 ? Math.round((session.correct / session.total) * 100) : 0

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2 text-sm text-slate-400">
        <button className="shrink-0 hover:text-slate-200" onClick={onQuit}>
          ← Quit
        </button>
        <div className="flex gap-3 sm:gap-4">
          <span>
            Q {Math.min(session.total + (answered ? 0 : 1), settings.sessionLength)}/
            {settings.sessionLength}
          </span>
          <span>
            ✓ {session.correct}/{session.total} ({accuracy}%)
          </span>
          <span>🔥 {session.streak}</span>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded bg-slate-800">
        <div
          className="h-full bg-green-500 transition-all"
          style={{
            width: `${(session.total / settings.sessionLength) * 100}%`,
          }}
        />
      </div>

      {question.type === 'note-name' ? (
        <NoteNameQuestion
          key={question.id}
          question={question}
          onComplete={handleComplete}
        />
      ) : (
        <KeyboardQuestion
          key={question.id}
          question={question}
          onComplete={handleComplete}
        />
      )}

      {answered && (
        <div className="flex flex-col items-center gap-3">
          <p
            className={`text-lg font-semibold ${
              answered.correct ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {answered.correct ? 'Correct!' : `Answer: ${answered.expected}`}
          </p>
          <button
            type="button"
            autoFocus
            onClick={advance}
            className="rounded-lg bg-blue-600 px-8 py-2 font-semibold hover:bg-blue-500"
          >
            {session.total >= settings.sessionLength ? 'See results' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  )
}
