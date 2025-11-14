'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'

export async function saveClubInfo(
  userId: string,
  clubName: string,
  clubAddress: string,
  rules: string,
  workHoursJson?: string
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
    
    if (workHoursJson) {
      const workHours = JSON.parse(workHoursJson)
      const dayMapping: Record<string, number> = {
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6,
        'sunday': 7
      }
      
      for (const [day, hours] of Object.entries(workHours)) {
        const dayOfWeek = dayMapping[day.toLowerCase()]
        const { start, end, closed } = hours as { start: string; end: string; closed: boolean }
        
        if (!closed) {
          await sql`
            INSERT INTO workhours (userid, day_of_week, start_time, end_time)
            VALUES (${userId}, ${dayOfWeek}, ${start}, ${end})
          `
        }
      }
    }
  } catch (error) {
    console.error('Error saving club information:', error)
    throw new Error('Failed to save club information to database')
  }
}

