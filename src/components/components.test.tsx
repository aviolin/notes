import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PianoKeyboard } from './PianoKeyboard'
import { toVexKey } from './vexkey'

describe('toVexKey', () => {
  it('parses naturals, sharps and flats', () => {
    expect(toVexKey('C4')).toEqual({ key: 'c/4', accidental: null })
    expect(toVexKey('C#4')).toEqual({ key: 'c#/4', accidental: '#' })
    expect(toVexKey('Eb3')).toEqual({ key: 'eb/3', accidental: 'b' })
  })
})

describe('PianoKeyboard', () => {
  it('reports the clicked key as a MIDI number', () => {
    const onKeyClick = vi.fn()
    render(
      <PianoKeyboard selectedMidis={[]} onKeyClick={onKeyClick} baseOctave={4} />,
    )
    // Middle C in the first octave is MIDI 60.
    fireEvent.click(screen.getByTestId('key-60'))
    expect(onKeyClick).toHaveBeenCalledWith(60)
    // C#4 is MIDI 61.
    fireEvent.click(screen.getByTestId('key-61'))
    expect(onKeyClick).toHaveBeenCalledWith(61)
  })

  it('does not fire when disabled', () => {
    const onKeyClick = vi.fn()
    render(
      <PianoKeyboard
        selectedMidis={[]}
        onKeyClick={onKeyClick}
        disabled
        baseOctave={4}
      />,
    )
    fireEvent.click(screen.getByTestId('key-60'))
    expect(onKeyClick).not.toHaveBeenCalled()
  })

  it('renders two octaves of keys (24 keys)', () => {
    render(<PianoKeyboard selectedMidis={[]} onKeyClick={() => {}} octaves={2} />)
    // 7 white + 5 black per octave = 12; two octaves = 24.
    const keys = screen.getAllByRole('button')
    expect(keys).toHaveLength(24)
  })
})
