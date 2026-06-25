import { useStats } from '../store/statsStore'
import { useSession } from '../store/sessionStore'

interface Props {
  /** Show the just-finished session's score cards; false when browsing history. */
  showSessionSummary?: boolean
  onPracticeAgain: () => void
  onBack: () => void
}

function labelForKey(key: string): string {
  // keys look like 'note:C#' or 'chord:C:major'
  const [kind, ...rest] = key.split(':')
  if (kind === 'chord') {
    const [root, quality] = rest
    return `${root} ${quality}`
  }
  return rest.join(':')
}

export function StatsScreen({
  showSessionSummary = true,
  onPracticeAgain,
  onBack,
}: Props) {
  const session = useSession()
  const byKey = useStats((s) => s.byKey)
  const clear = useStats((s) => s.clear)

  const accuracy =
    session.total > 0 ? Math.round((session.correct / session.total) * 100) : 0

  const rows = Object.entries(byKey)
    .map(([key, rec]) => ({
      key,
      label: labelForKey(key),
      ...rec,
      acc: rec.seen > 0 ? rec.correct / rec.seen : 0,
    }))
    .sort((a, b) => a.acc - b.acc) // weakest first

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 sm:gap-8 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">
          {showSessionSummary ? 'Session complete' : 'History'}
        </h1>
      </header>

      {showSessionSummary && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Stat label="Score" value={`${session.correct}/${session.total}`} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
          <Stat label="Best streak" value={`${session.bestStreak}`} />
        </div>
      )}

      <div className="flex flex-wrap gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onPracticeAgain}
          className="flex-1 rounded-lg bg-green-600 px-6 py-3 font-bold hover:bg-green-500 sm:flex-none"
        >
          {showSessionSummary ? 'Practice again' : 'Start practice'}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg bg-slate-700 px-6 py-3 font-semibold hover:bg-slate-600 sm:flex-none"
        >
          {showSessionSummary ? 'Change settings' : 'Back'}
        </button>
      </div>

      {rows.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-300">
              All-time accuracy (weakest first)
            </h2>
            <button
              type="button"
              onClick={clear}
              className="text-sm text-slate-500 underline hover:text-slate-300"
            >
              Clear history
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {rows.map((r) => (
              <div
                key={r.key}
                className="flex items-center gap-3 text-sm"
                title={`${r.correct}/${r.seen} correct`}
              >
                <span className="w-20 shrink-0 truncate font-medium sm:w-28">
                  {r.label}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded bg-slate-800">
                  <div
                    className={`h-full ${
                      r.acc < 0.6 ? 'bg-red-500' : r.acc < 0.85 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${r.acc * 100}%` }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-slate-400">
                  {Math.round(r.acc * 100)}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {rows.length === 0 && (
        <p className="text-slate-400">
          No practice history yet. Complete a session to start tracking your
          accuracy.
        </p>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-800 p-4 text-center">
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  )
}
