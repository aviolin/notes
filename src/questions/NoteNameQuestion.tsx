import { useState } from 'react'
import type { AnswerResult, Question } from '../music/types'
import { checkChordName, checkNoteName } from '../music/answer'
import { Staff } from '../components/Staff'
import { MultipleChoice } from '../components/MultipleChoice'
import { useSettings } from '../store/settingsStore'
import { playNotes } from '../audio/piano'

interface Props {
  question: Question
  onComplete: (result: AnswerResult) => void
}

/** Name-the-note question: staff prompt answered via multiple choice. */
export function NoteNameQuestion({ question, onComplete }: Props) {
  const [picked, setPicked] = useState<string | null>(null)
  const [pickedCorrect, setPickedCorrect] = useState<boolean | null>(null)
  const strictSpelling = useSettings((s) => s.strictSpelling)
  const audioEnabled = useSettings((s) => s.audioEnabled)

  const handlePick = (choice: string) => {
    if (picked) return
    const result =
      question.prompt.kind === 'chord'
        ? checkChordName(question.prompt, choice)
        : checkNoteName(question.prompt, choice, strictSpelling)
    setPicked(choice)
    setPickedCorrect(result.correct)
    void playNotes(question.prompt.midis, audioEnabled)
    onComplete(result)
  }

  const prompt =
    question.prompt.kind === 'chord' ? 'Name the chord' : 'Name the note'

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-slate-400">{prompt}</p>
      <div className="max-w-full overflow-x-auto rounded-xl bg-white p-2">
        <Staff spellings={question.prompt.spellings} clef={question.clef} />
      </div>
      <div className="w-full max-w-md">
        <MultipleChoice
          choices={question.choices ?? []}
          answer={question.answer ?? ''}
          picked={picked}
          pickedCorrect={pickedCorrect}
          onPick={handlePick}
        />
      </div>
    </div>
  )
}
