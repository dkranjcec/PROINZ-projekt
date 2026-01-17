import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import sql from '@/lib/db'
import { headers } from 'next/headers'
import { notifyBookingConfirmed, notifyClubNewBooking, createBookingReminder } from '@/lib/notifications'

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    // Extract booking data from metadata
    const { terenid, clubid, playerid, starttime, endtime } = session.metadata || {}

    if (!terenid || !clubid || !playerid || !starttime || !endtime) {
      console.error('Missing metadata in session')
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    try {
      // Create confirmed booking
      const result = await sql`
        INSERT INTO termin (terenid, playerid, clubid, starttime, endtime, confirmed, stripesessionid)
        VALUES (${terenid}, ${playerid}, ${clubid}, ${starttime}, ${endtime}, true, ${session.id})
        RETURNING *
      `

      const terminid = result[0]?.terminid

      // Update session metadata with terminid for future refund tracking
      if (terminid && session.payment_intent) {
        try {
          await stripe.paymentIntents.update(session.payment_intent as string, {
            metadata: { terminid: terminid.toString() }
          })
        } catch (err) {
          console.error('Failed to update payment intent metadata:', err)
        }
      }

      // Notify club of new paid booking
      await notifyClubNewBooking(terenid, playerid, clubid, starttime, endtime, 'paid')

      // Send notification and email to player
      await notifyBookingConfirmed(terenid, playerid, clubid, starttime, endtime)

      // Create scheduled reminder for booking day
      await createBookingReminder(terenid, playerid, clubid, starttime)

      console.log('Booking confirmed after payment:', { terenid, playerid, starttime })
    } catch (error) {
      console.error('Error creating booking after payment:', error)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
