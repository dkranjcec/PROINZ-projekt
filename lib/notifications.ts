import sql from './db'
import { sendBookingConfirmationEmail } from './email'
import { clerkClient } from '@clerk/nextjs/server'

export async function createBookingReminder(
  terenid: string,
  playerid: string,
  clubid: string,
  starttime: string
) {
  try {
    // Compute midnight at the booking's local timezone (respect offset in starttime)
    const now = new Date()
    let reminderTime: Date
    const isoMatch = String(starttime).match(/^(\d{4}-\d{2}-\d{2})(?:T.*?)(Z|[+-]\d{2}:\d{2})?$/)
    if (isoMatch) {
      const datePart = isoMatch[1]
      const offsetPart = isoMatch[2] || 'Z'
      const midnightWithOffset = `${datePart}T00:00:00${offsetPart}`
      reminderTime = new Date(midnightWithOffset)
    } else {
      const bookingDate = new Date(starttime)
      reminderTime = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate(), 0, 0, 0)
    }
    
    // Get court and club details
    const [court] = await sql`
      SELECT t.terenname, c.clubname
      FROM teren t
      JOIN club c ON t.userid = c.userid
      WHERE t.terenid = ${terenid}
    `

    if (!court) return

    const startTime = new Date(starttime).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })

    // If the booking is for today (reminderTime already passed), create an immediate in-app notification
    if (reminderTime <= now) {
      await sql`
        INSERT INTO notification (userid, notitext, schedtime)
        VALUES (
          ${playerid},
          ${`Reminder: You have a booking today at ${court.clubname} (${court.terenname}) at ${startTime}`},
          NOW()
        )
      `
    } else {
      // Create scheduled notification (SCHEDULED: prefix marks it as not yet sent)
      await sql`
        INSERT INTO notification (userid, notitext, schedtime)
        VALUES (
          ${playerid},
          ${`SCHEDULED: Reminder: You have a booking today at ${court.clubname} (${court.terenname}) at ${startTime}`},
          ${reminderTime.toISOString()}
        )
      `
    }

    console.log('Created scheduled reminder for booking')
  } catch (error) {
    console.error('Error creating booking reminder:', error)
  }
}

export async function deleteBookingReminder(
  playerid: string,
  starttime: string
) {
  try {
    // Delete scheduled reminder for this booking (compute midnight with original offset)
    let reminderTime: Date
    const isoMatch = String(starttime).match(/^(\d{4}-\d{2}-\d{2})(?:T.*?)(Z|[+-]\d{2}:\d{2})?$/)
    if (isoMatch) {
      const datePart = isoMatch[1]
      const offsetPart = isoMatch[2] || 'Z'
      const midnightWithOffset = `${datePart}T00:00:00${offsetPart}`
      reminderTime = new Date(midnightWithOffset)
    } else {
      const bookingDate = new Date(starttime)
      reminderTime = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate(), 0, 0, 0)
    }

    await sql`
      DELETE FROM notification
      WHERE userid = ${playerid}
        AND schedtime = ${reminderTime.toISOString()}
        AND notitext LIKE 'SCHEDULED:%'
    `

    console.log('Deleted scheduled reminder for cancelled booking')
  } catch (error) {
    console.error('Error deleting booking reminder:', error)
  }
}

export async function notifyClubNewBooking(
  terenid: string,
  playerid: string,
  clubid: string,
  starttime: string,
  endtime: string,
  paymentStatus: 'pending' | 'paid'
) {
  try {
    // Get club email from Clerk
    const client = await clerkClient()
    const clubUser = await client.users.getUser(clubid)
    
    // Get player and court details
    const [player] = await sql`
      SELECT firstname, lastname FROM player WHERE userid = ${playerid}
    `
    
    const [court] = await sql`
      SELECT terenname FROM teren WHERE terenid = ${terenid}
    `

    if (!player || !court) return

    const playerName = `${player.firstname} ${player.lastname}`
    const status = paymentStatus === 'paid' ? 'paid online' : 'pending in-person payment'

    // Create in-app notification for club
    await sql`
      INSERT INTO notification (userid, notitext, schedtime)
      VALUES (
        ${clubid},
        ${`New booking from ${playerName} for ${court.terenname} (${status})`},
        NOW()
      )
    `

    console.log('Club notified of new booking')
  } catch (error) {
    console.error('Error notifying club:', error)
  }
}

export async function notifyBookingConfirmed(
  terenid: string,
  playerid: string,
  clubid: string,
  starttime: string,
  endtime: string
) {
  try {
    // Get player email and name from Clerk
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(playerid)
    
    const playerEmail = clerkUser.emailAddresses[0]?.emailAddress
    if (!playerEmail) {
      console.error('No email found for player:', playerid)
      return
    }

    // Get player details from database
    const [player] = await sql`
      SELECT firstname, lastname FROM player WHERE userid = ${playerid}
    `
    
    // Get court and club details
    const [court] = await sql`
      SELECT t.terenname, c.clubname
      FROM teren t
      JOIN club c ON t.userid = c.userid
      WHERE t.terenid = ${terenid}
    `

    if (!player || !court) return

    const playerName = `${player.firstname} ${player.lastname}`

    // Create in-app notification
    await sql`
      INSERT INTO notification (userid, notitext, schedtime)
      VALUES (
        ${playerid},
        ${`Your booking at ${court.clubname} for ${court.terenname} has been confirmed!`},
        NOW()
      )
    `

    // Send email
    await sendBookingConfirmationEmail(
      playerEmail,
      playerName,
      court.terenname,
      court.clubname,
      starttime,
      endtime
    )
  } catch (error) {
    console.error('Error sending notification:', error)
  }
}
