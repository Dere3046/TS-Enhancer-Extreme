import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { ToolPage } from '../components/ToolPage'
import { AppProvider } from '../contexts/AppContext'

// Mock TSeed
vi.mock('../services/tseed', () => ({
  TSeed: {
    system: {
      vbhashApply: vi.fn().mockResolvedValue('OK'),
      vbhashPersist: vi.fn().mockResolvedValue('OK'),
      vbhashClear: vi.fn().mockResolvedValue('OK'),
      vbhashGet: vi.fn().mockResolvedValue('hash123'),
      clearCache: vi.fn().mockResolvedValue('OK'),
      autoproxyEnable: vi.fn().mockResolvedValue('OK'),
      autoproxyDisable: vi.fn().mockResolvedValue('OK'),
    },
    service: {
      proxy: vi.fn().mockResolvedValue('OK'),
    },
  },
  showToast: vi.fn(),
}))

describe('ToolPage', () => {
  it('should render tool page', () => {
    render(
      React.createElement(AppProvider, null,
        React.createElement(ToolPage, null)
      )
    )
    expect(screen.getByText(/VBHash/i)).toBeInTheDocument()
  })
})
