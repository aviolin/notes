import * as Tone from 'tone'

// Lazily-created sampled piano (Salamander samples via the Tone.js CDN). The
// audio context can only start after a user gesture, so we call Tone.start()
// on the first playback request.

let sampler: Tone.Sampler | null = null
let ready = false

function getSampler(): Tone.Sampler {
  if (!sampler) {
    sampler = new Tone.Sampler({
      urls: {
        C4: 'C4.mp3',
        'D#4': 'Ds4.mp3',
        'F#4': 'Fs4.mp3',
        A4: 'A4.mp3',
        C5: 'C5.mp3',
        'D#5': 'Ds5.mp3',
        'F#5': 'Fs5.mp3',
        A5: 'A5.mp3',
      },
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
      release: 1,
      onload: () => {
        ready = true
      },
    }).toDestination()
  }
  return sampler
}

/** Play one or more MIDI notes through the piano sampler. No-op when disabled. */
export async function playNotes(midis: number[], enabled = true): Promise<void> {
  if (!enabled || midis.length === 0) return
  try {
    await Tone.start()
    const s = getSampler()
    if (!ready) return // samples still loading; skip silently
    const notes = midis.map((m) => Tone.Frequency(m, 'midi').toNote())
    s.triggerAttackRelease(notes, '2n')
  } catch {
    // Audio is non-essential; never let playback errors break the quiz.
  }
}
