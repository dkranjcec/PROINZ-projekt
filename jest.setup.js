import '@testing-library/jest-dom'
import React from 'react'

global.fetch = jest.fn()

if (!React.act) {
  React.act = async (callback) => {
    const result = await callback()
    return result
  }
}

jest.mock('next/link', () => {
  return ({ children, href }) => {
    return React.createElement('a', { href }, children)
  }
})

jest.mock('lucide-react', () => ({
  Search: () => React.createElement('span', null, 'Search Icon')
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => React.createElement('button', props, children)
}))

jest.mock('@/components/ui/input', () => ({
  Input: (props) => React.createElement('input', props)
}))

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300
    })
  }
}))

beforeEach(() => {
  jest.clearAllMocks()
})
