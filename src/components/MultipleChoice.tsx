interface MultipleChoiceProps {
  choices: string[]
  /** Canonical correct answer (always shown green once revealed). */
  answer: string
  picked: string | null
  /** Whether the user's pick was judged correct (handles enharmonics). */
  pickedCorrect: boolean | null
  onPick: (choice: string) => void
}

export function MultipleChoice({
  choices,
  answer,
  picked,
  pickedCorrect,
  onPick,
}: MultipleChoiceProps) {
  const revealed = picked !== null

  const classFor = (choice: string): string => {
    const base =
      'touch-manipulation rounded-lg px-4 py-3 text-lg font-semibold border transition-colors'
    if (!revealed) {
      return `${base} bg-slate-700 border-slate-600 hover:bg-slate-600 cursor-pointer`
    }
    const isCorrect = choice === answer || (choice === picked && pickedCorrect)
    if (isCorrect) return `${base} bg-green-600 border-green-400`
    if (choice === picked) return `${base} bg-red-600 border-red-400`
    return `${base} bg-slate-700 border-slate-600 opacity-60`
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {choices.map((choice) => (
        <button
          key={choice}
          type="button"
          disabled={revealed}
          className={classFor(choice)}
          onClick={() => onPick(choice)}
        >
          {choice}
        </button>
      ))}
    </div>
  )
}
