import sql from '@/lib/db'
import { NextResponse } from 'next/server'

// Simple daily cron - just sends booking reminders
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Find scheduled notifications
    const pendingNotifications = await sql`
      SELECT * FROM notification
      WHERE schedtime <= ${now.toISOString()}
        AND notitext LIKE 'SCHEDULED:%'
      ORDER BY schedtime ASC
      LIMIT 100
    `

    let sent = 0

    for (const notification of pendingNotifications) {
      try {
        const actualMessage = notification.notitext.replace('SCHEDULED:', '')
        
        await sql`
          UPDATE notification
          SET notitext = ${actualMessage},
              schedtime = NOW()
          WHERE notiid = ${notification.notiid}
        `

        sent++
      } catch (error) {
        console.error('Error sending notification:', error)
      }
    }

    return NextResponse.json({ 
      success: true, 
      notificationsSent: sent,
      timestamp: now.toISOString()
    })
  } catch (error) {
    console.error('Error in booking reminders cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
