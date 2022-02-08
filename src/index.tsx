import { EmailAuthProvider, getAuth } from 'firebase/auth'
import { initializeApp } from 'firebase/app'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  runTransaction,
  setDoc,
  where,
  query,
} from 'firebase/firestore'
import React from 'react'
import ReactDOM from 'react-dom'
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'

import { loadStats } from './lib/stats'

const { useEffect, useState } = React

console.log(process.env)
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

    async function saveUser() {
      const db = getFirestore()
      const userId = currentUser!.uid
      const gameStats = loadStats()
      try {
        await runTransaction(db, async (transaction) => {
          const usersRef = collection(db, 'users')
          const q = query(usersRef, where('userId', '==', userId))
          const querySnapshot = await getDocs(q)
          if (querySnapshot.empty) {
            const docRef = await addDoc(usersRef, {
              userId,
              gameStats,
            })
            console.log('Document written with ID: ', docRef.id)
          } else {
            const user = querySnapshot.docs[0]
            await setDoc(doc(db, 'users', user.id), { userId, gameStats })
            console.log('Document updated with ID: ', user.id)
          }
        })
      } catch (e) {
        console.error('Error adding document: ', e)
      }
    }

    saveUser()
  }, [currentUser])

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
        <App />
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
