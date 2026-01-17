import sql from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Verify this is called by authorized source (Vercel Cron or manual with secret)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Find notifications scheduled for now or earlier that haven't been "sent" yet
    // We'll look for notification text containing "Reminder:" that are scheduled
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
        // Extract the actual message (remove SCHEDULED: prefix)
        const actualMessage = notification.notitext.replace('SCHEDULED:', '')
        
        // Update the notification to mark it as sent
        await sql`
          UPDATE notification
          SET notitext = ${actualMessage},
              schedtime = NOW()
          WHERE notiid = ${notification.notiid}
        `

        sent++
      } catch (error) {
        console.error('Error sending scheduled notification:', notification, error)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sent ${sent} scheduled notifications`,
      checked: pendingNotifications.length
    })
  } catch (error) {
    console.error('Error in notification scheduler cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
