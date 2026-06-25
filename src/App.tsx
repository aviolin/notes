import { useState } from 'react'
import { ConfigScreen } from './screens/ConfigScreen'
import { PracticeScreen } from './screens/PracticeScreen'
import { StatsScreen } from './screens/StatsScreen'

type View = 'config' | 'practice' | 'stats'

function App() {
  const [view, setView] = useState<View>('config')
  // Whether the stats screen was reached by finishing a session (show its
  // summary) or opened from home as history (summary hidden).
  const [statsFromSession, setStatsFromSession] = useState(false)

  const showStats = (fromSession: boolean) => {
    setStatsFromSession(fromSession)
    setView('stats')
  }

  return (
    <div className="min-h-full">
      {view === 'config' && (
        <ConfigScreen
          onStart={() => setView('practice')}
          onViewHistory={() => showStats(false)}
        />
      )}
      {view === 'practice' && (
        <PracticeScreen
          onFinish={() => showStats(true)}
          onQuit={() => setView('config')}
        />
      )}
      {view === 'stats' && (
        <StatsScreen
          showSessionSummary={statsFromSession}
          onPracticeAgain={() => setView('practice')}
          onBack={() => setView('config')}
        />
      )}
    </div>
  )
}

export default App
