import { useEffect, useRef } from 'react'
import {
  Accidental,
  Formatter,
  Renderer,
  Stave,
  StaveNote,
  Voice,
} from 'vexflow'
import type { Clef } from '../music/types'
import { toVexKey } from './vexkey'

interface StaffProps {
  /** Spelled notes with octave, e.g. ['C#4'] or ['C4','E4','G4'] (a chord). */
  spellings: string[]
  clef: Clef
  width?: number
  height?: number
}

/**
 * Renders a single note or chord on a treble/bass stave using VexFlow. Multiple
 * spellings are stacked into one StaveNote so chords display as a column.
 */
export function Staff({ spellings, clef, width = 280, height = 180 }: StaffProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el || spellings.length === 0) return
    el.innerHTML = ''

    const renderer = new Renderer(el, Renderer.Backends.SVG)
    renderer.resize(width, height)
    const ctx = renderer.getContext()

    const stave = new Stave(10, 30, width - 20)
    stave.addClef(clef)
    stave.setContext(ctx).draw()

    const vexKeys = spellings.map(toVexKey)
    const note = new StaveNote({
      clef,
      keys: vexKeys.map((k) => k.key),
      duration: 'w',
    })
    vexKeys.forEach((k, i) => {
      if (k.accidental) note.addModifier(new Accidental(k.accidental), i)
    })

    const voice = new Voice({ numBeats: 4, beatValue: 4 })
    voice.addTickables([note])
    new Formatter().joinVoices([voice]).format([voice], width - 60)
    voice.draw(ctx, stave)

    return () => {
      el.innerHTML = ''
    }
  }, [spellings, clef, width, height])

  return <div ref={containerRef} className="flex justify-center" />
}
