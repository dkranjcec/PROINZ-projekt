import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import sql from '@/lib/db'
import { headers } from 'next/headers'

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
      await sql`
        INSERT INTO termin (terenid, playerid, clubid, starttime, endtime, confirmed)
        VALUES (${terenid}, ${playerid}, ${clubid}, ${starttime}, ${endtime}, true)
      `

      console.log('Booking confirmed after payment:', { terenid, playerid, starttime })
    } catch (error) {
      console.error('Error creating booking after payment:', error)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
