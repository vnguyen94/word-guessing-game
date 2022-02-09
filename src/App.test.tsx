import React from 'react'
import { render, screen } from '@testing-library/react'
import App from './App'
import { GAME_TITLE } from './constants/strings'
import { defaultStats, GameStats } from './lib/stats'

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
})

test('renders App component', () => {
  const [gameStats, setGameStats] = React.useState<GameStats>(defaultStats)
  render(
    <App
      gameStats={gameStats!}
      setGameStats={async (newGameStats) => setGameStats(newGameStats)}
      currentDayScore={undefined}
      persistScores={() => Promise.resolve()}
    />
  )
  const linkElement = screen.getByText(GAME_TITLE)
  expect(linkElement).toBeInTheDocument()
})
