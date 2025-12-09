'use server'

import { auth } from '@clerk/nextjs/server'
import sql from '@/lib/db'

export async function savePlayerInfo(
  userId: string,
  firstName: string,
  lastName: string,
  phoneNumber: string
  ) 
  {
  const { userId: authUserId } = await auth()
  
  if (!authUserId || authUserId !== userId) {
    throw new Error('Unauthorized')
  }
  
  const [user] = await sql`
    SELECT * FROM users WHERE userid = ${userId}
  `
  
  if (!user || user.role !== 'player') {
    throw new Error('User is not a player')
  }
  
  const [existingPlayer] = await sql`
    SELECT * FROM player WHERE userid = ${userId}
  `
  
  if (existingPlayer) {
    throw new Error('Player information already exists')
  }
  
  try {
    await sql`
      INSERT INTO player (userid, firstname, lastname, phone_number)
      VALUES (${userId}, ${firstName}, ${lastName}, ${phoneNumber})
    `
  } catch (error) {
    console.error('Error saving player information:', error)
    throw new Error('Failed to save player information to database')
  }
}
