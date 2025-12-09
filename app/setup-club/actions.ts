'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'

export async function saveClubInfo(
  userId: string,
  clubName: string,
  clubAddress: string,
  rules: string
) {

  const { userId: authUserId } = await auth()
  
  if (!authUserId || authUserId !== userId) {
    throw new Error('Unauthorized')
  }
  

  const [user] = await sql`
    SELECT * FROM users WHERE userid = ${userId}
  `
  
  if (!user || user.role !== 'club') {
    throw new Error('User is not a club')
  }
  

  const [existingClub] = await sql`
    SELECT * FROM club WHERE userid = ${userId}
  `
  
  if (existingClub) {
    throw new Error('Club information already exists')
  }
  
  try {
    await sql`
      INSERT INTO club (userid, clubname, clubaddress, rules)
      VALUES (${userId}, ${clubName}, ${clubAddress}, ${rules})
    `
  } catch (error) {
    console.error('Error saving club information:', error)
    throw new Error('Failed to save club information to database')
  }
}

