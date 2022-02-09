import { getAuth } from 'firebase/auth'
import {
  addDoc, 
  collection,
  doc,
  getDocs,
  getFirestore,
  setDoc,
  where,
  query,
} from 'firebase/firestore'

import { MAX_CHALLENGES } from '../constants/settings'

export type Score = {
  guesses: string[];
  solution: string;
  date: Date;
  userId: string;
};

// In stats array elements 0-5 are successes in 1-6 trys
export const addStatsForCompletedGame = (
  gameStats: GameStats,
  count: number
) => {
  // Count is number of incorrect guesses before end.
  const stats = { ...gameStats }

  stats.totalGames += 1

  if (count >= MAX_CHALLENGES) {
    // A fail situation
    stats.currentStreak = 0
    stats.gamesFailed += 1
  } else {
    stats.winDistribution[count] += 1
    stats.currentStreak += 1

    if (stats.bestStreak < stats.currentStreak) {
      stats.bestStreak = stats.currentStreak
    }
  }

  stats.successRate = getSuccessRate(stats)

  persistStats(stats);
  return stats
}

export type User = {
  gameStats: GameStats;
  userId: string;
}

export async function fetchUser(): Promise<User | null> {
  const auth = getAuth()
  const { currentUser } = auth
  const db = getFirestore()
  const userId = currentUser!.uid
  const usersRef = collection(db, 'users')
  const q = query(usersRef, where('userId', '==', userId))
  const querySnapshot = await getDocs(q)
  return (querySnapshot.docs[0]?.data() as unknown as User) ?? null;
}

export function getCurrentDate(): Date {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  return currentDate
}

export async function fetchScore({ userId, date }: { userId: string; date: Date }): Promise<{ id: string; score: Score } | null> {
  const db = getFirestore()
  const scoresRef = collection(db, 'scores')
  const q = query(scoresRef, where('userId', '==', userId), where('date', '==', date));
  const querySnapshot = await getDocs(q)
  const scoreModel = querySnapshot.docs[0];

  if (!scoreModel) {
    return null;
  }

  return {
    score: scoreModel.data() as unknown as Score,
    id: scoreModel.id,
  };
}

export type GameStats = {
  winDistribution: number[]
  gamesFailed: number
  currentStreak: number
  bestStreak: number
  totalGames: number
  successRate: number
}

export async function persistScores(newScore: Score): Promise<void> {
  const db = getFirestore()
  const scoresRef = collection(db, 'scores')

  try {
    const existingScore = await fetchScore(newScore);
    console.log('existingScore');
    console.log(existingScore);

    if (!existingScore) {
      const docRef = await addDoc(scoresRef, newScore);
      console.info('Score written with ID: ', docRef.id)
    } else {
      await setDoc(doc(db, 'scores', existingScore.id), newScore);
      console.info('Score updated with ID: ', existingScore.id);
    }
  } catch (e) {
    console.error('Error adding score: ', e)
  }
}


export async function persistStats(gameStats: GameStats) {
  const auth = getAuth()
  const { currentUser } = auth
  const db = getFirestore()
  const userId = currentUser!.uid

  try {
    await setDoc(doc(db, 'users', userId), { gameStats })
    console.info('Stat updated with ID: ', userId)
  } catch (e) {
    console.error('Error adding stat: ', e)
  }
}

export const defaultStats: GameStats = {
  winDistribution: Array.from(new Array(MAX_CHALLENGES), () => 0),
  gamesFailed: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalGames: 0,
  successRate: 0,
}

export const loadStats = async (): Promise<GameStats> => {
  const persistedStats = await fetchUser();
  return persistedStats?.gameStats ?? defaultStats;
}

const getSuccessRate = (gameStats: GameStats) => {
  const { totalGames, gamesFailed } = gameStats

  return Math.round(
    (100 * (totalGames - gamesFailed)) / Math.max(totalGames, 1)
  )
}
