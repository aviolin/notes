import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfigScreen } from './ConfigScreen'

describe('ConfigScreen', () => {
  it('mounts with stores and starts practice', () => {
    const onStart = vi.fn()
    render(<ConfigScreen onStart={onStart} onViewHistory={() => {}} />)
    expect(screen.getByText('Piano Note Trainer')).toBeInTheDocument()
    // Default settings produce a non-empty pool, so Start is enabled.
    fireEvent.click(screen.getByText('Start practice'))
    expect(onStart).toHaveBeenCalled()
  })

  it('disables start when no note names are selected', () => {
    render(<ConfigScreen onStart={() => {}} onViewHistory={() => {}} />)
    // Switch to a state with an empty pool by deselecting every note letter.
    for (const letter of ['C', 'D', 'E', 'F', 'G', 'A', 'B']) {
      fireEvent.click(screen.getByRole('button', { name: letter }))
    }
    const start = screen.getByText('Start practice') as HTMLButtonElement
    expect(start).toBeDisabled()
  })
})
