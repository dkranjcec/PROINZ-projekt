import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clubName, clubAddress, clubRules, workHours, content, photos } = await request.json()

    await sql`
      UPDATE club 
      SET clubname = ${clubName}, clubaddress = ${clubAddress}, rules = ${clubRules}
      WHERE userid = ${userId}
    `

    if (workHours && Array.isArray(workHours)) {
      await sql`
        DELETE FROM workhours WHERE userid = ${userId}
      `
      
      for (const wh of workHours) {
        await sql`
          INSERT INTO workhours (userid, day_of_week, start_time, end_time)
          VALUES (${userId}, ${wh.day_of_week}, ${wh.start_time}, ${wh.end_time})
        `
      }
    }

    if (content !== undefined) {
      const [existingContent] = await sql`
        SELECT * FROM content WHERE userid = ${userId}
      `
      
      if (existingContent) {
        await sql`
          UPDATE content 
          SET contenttext = ${content}
          WHERE userid = ${userId}
        `
      } else {
        await sql`
          INSERT INTO content (userid, contenttext)
          VALUES (${userId}, ${content})
        `
      }
    }

    if (photos && Array.isArray(photos)) {
      await sql`
        DELETE FROM clubphoto WHERE userid = ${userId}
      `
      
      for (const photo of photos) {
        await sql`
          INSERT INTO clubphoto (userid, photolink)
          VALUES (${userId}, ${photo.photolink})
        `
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating club:', error)
    return NextResponse.json({ error: 'Failed to update club information' }, { status: 500 })
  }
}
