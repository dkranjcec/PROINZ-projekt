import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import sql from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { recurringid } = await request.json()

    if (!recurringid) {
      return NextResponse.json({ error: 'Missing recurring booking ID' }, { status: 400 })
    }

    // Get recurring booking
    const [recurring] = await sql`
      SELECT * FROM recurring_booking
      WHERE recurringid = ${recurringid}
        AND playerid = ${userId}
        AND is_active = true
    `

    if (!recurring) {
      return NextResponse.json({ error: 'Recurring booking not found' }, { status: 404 })
    }

    // Cancel Stripe subscription
    if (recurring.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(recurring.stripe_subscription_id)
      } catch (error) {
        console.error('Error cancelling Stripe subscription:', error)
      }
    }

    // Mark as cancelled
    await sql`
      UPDATE recurring_booking
      SET is_active = false, cancelled_at = NOW()
      WHERE recurringid = ${recurringid}
    `

    // Cancel future bookings
    await sql`
      DELETE FROM termin
      WHERE playerid = ${userId}
        AND terenid = ${recurring.terenid}
        AND starttime > NOW()
        AND confirmed = true
    `

    // Notify player
    await sql`
      INSERT INTO notification (userid, notitext, schedtime)
      VALUES (
        ${userId},
        ${'RECURRING_BOOKING_CANCELLED: Your recurring booking has been cancelled.'},
        NOW()
      )
    `

    return NextResponse.json({ success: true, message: 'Recurring booking cancelled' })
  } catch (error) {
    console.error('Error cancelling recurring booking:', error)
    return NextResponse.json({ error: 'Failed to cancel recurring booking' }, { status: 500 })
  }
}
