import { EmailAuthProvider, getAuth } from 'firebase/auth'
import { initializeApp } from 'firebase/app'
import React from 'react'
import ReactDOM from 'react-dom'
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'

import {
  fetchScore,
  GameStats,
  getCurrentDate,
  loadStats,
  persistScores,
  persistStats,
  Score,
} from './lib/stats'

const { useEffect, useState } = React

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
}

initializeApp(firebaseConfig)

// Configure FirebaseUI.
const uiConfig = {
  signInFlow: 'popup',
  signInOptions: [EmailAuthProvider.PROVIDER_ID],
  callbacks: {
    // Avoid redirects after sign-in.
    signInSuccessWithAuthResult: () => false,
  },
}

function Container() {
  const [isSignedIn, setIsSignedIn] = useState(false) // Local signed-in state.
  const [gameStats, setStats] = useState<GameStats | undefined>()
  const [currentDayScore, setCurrentDayScore] = useState<Score | undefined>()

  const auth = getAuth()
  const { currentUser } = auth

  // Listen to the Firebase Auth state and set the local state.
  useEffect(() => {
    const unregisterAuthObserver = auth.onAuthStateChanged((user) => {
      setIsSignedIn(!!user)
    })
    return () => unregisterAuthObserver() // Make sure we un-register Firebase observers when the component unmounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!currentUser) {
      return
    }

    async function executeFetchStats() {
      const gameStats = await loadStats()
      setStats(gameStats)
      // persistStats(gameStats);
    }

    async function executeFetchCurrentDayScore() {
      const currentDate = getCurrentDate()
      const currentDayScore = await fetchScore({
        userId: currentUser!.uid,
        date: currentDate,
      })
      setCurrentDayScore(currentDayScore?.score ?? undefined)
    }

    executeFetchStats()
    executeFetchCurrentDayScore()
  }, [currentUser])

  const setGameStats = async (newGameStats: GameStats) => {
    setStats(newGameStats)
    return persistStats(newGameStats)
  }

  let content: React.ReactNode

  if (!isSignedIn) {
    content = (
      <div>
        <h1>My App</h1>
        <p>Please sign-in:</p>
        <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />
      </div>
    )
  } else {
    content = (
      <div>
        {gameStats ? (
          <App
            gameStats={gameStats}
            setGameStats={setGameStats}
            currentDayScore={currentDayScore}
            persistScores={(newScore) => {
              return persistScores({
                ...newScore,
                userId: currentUser!.uid,
              })
            }}
          />
        ) : (
          <div>loading stats...</div>
        )}
        <p>Welcome {currentUser?.displayName}! You are now signed-in!</p>
        <button onClick={() => auth.signOut()}>Sign-out</button>
      </div>
    )
  }

  return <React.StrictMode>{content}</React.StrictMode>
}

ReactDOM.render(<Container />, document.getElementById('root'))

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
