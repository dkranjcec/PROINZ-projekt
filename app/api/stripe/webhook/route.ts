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

  // Handle checkout.session.completed (initial payment)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const metadata = session.metadata || {}
    const { terenid, clubid, playerid, starttime, endtime, makeRecurring } = metadata

    console.log('[WEBHOOK] checkout.session.completed received:', {
      sessionId: session.id,
      metadata: { terenid, clubid, playerid, starttime, endtime, makeRecurring }
    })

    if (!terenid || !clubid || !playerid || !starttime || !endtime) {
      console.error('[WEBHOOK] Missing metadata in session:', metadata)
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    try {
      // Check if booking already exists
      const existing = await sql`
        SELECT * FROM termin 
        WHERE terenid = ${terenid} 
          AND starttime = ${starttime}
          AND endtime = ${endtime}
      `

      if (existing.length > 0) {
        console.log('[WEBHOOK] Booking already exists, updating stripe session ID:', existing[0])
        // Update existing booking with stripe session ID if missing
        await sql`
          UPDATE termin 
          SET stripesessionid = ${session.id}, confirmed = true
          WHERE terenid = ${terenid} 
            AND starttime = ${starttime}
            AND endtime = ${endtime}
        `
        console.log('[WEBHOOK] Updated existing booking with stripe session')
      } else {
        // Create first booking (confirmed immediately since payment succeeded)
        const result = await sql`
          INSERT INTO termin (playerid, terenid, clubid, starttime, endtime, confirmed, stripesessionid)
          VALUES (${playerid}, ${terenid}, ${clubid}, ${starttime}, ${endtime}, true, ${session.id})
          RETURNING *
        `

        if (result.length === 0) {
          console.error('[WEBHOOK] Failed to create booking - no rows returned')
          throw new Error('Failed to create booking')
        }

        console.log('[WEBHOOK] Booking created successfully:', result[0])
      }

      // Notify about first booking
      try {
        await notifyClubNewBooking(terenid, playerid, clubid, starttime, endtime, 'paid')
        await notifyBookingConfirmed(terenid, playerid, clubid, starttime, endtime)
        await createBookingReminder(terenid, playerid, clubid, starttime)
        console.log('[WEBHOOK] Notifications sent successfully')
      } catch (notifError) {
        console.error('[WEBHOOK] Error sending notifications:', notifError)
        // Don't fail the webhook if notifications fail
      }

      // If this is a recurring booking, create subscription
      if (makeRecurring === 'true') {
        const { dayOfWeek, startTime, endTime, price } = metadata

        // Calculate next occurrence (7 days from first booking)
        // Parse as UTC to preserve the exact date
        const firstBookingDate = new Date(starttime)
        const nextOccurrence = new Date(firstBookingDate.getTime() + (7 * 24 * 60 * 60 * 1000))

        // Billing anchor = 6 days before next booking
        const billingAnchor = new Date(nextOccurrence.getTime() - (6 * 24 * 60 * 60 * 1000))

        // Get payment method from session to attach to subscription
        const paymentIntentId = session.payment_intent as string
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
        const paymentMethodId = paymentIntent.payment_method as string

        // Get customer ID from session
        const customerId = session.customer as string
        
        if (!customerId) {
          throw new Error('No customer ID found in session')
        }

        // Create price for subscription
        const priceAmount = Math.round((parseFloat(price) + 2) * 100)
        const stripePrice = await stripe.prices.create({
          currency: 'eur',
          unit_amount: priceAmount,
          recurring: { interval: 'week' },
          product_data: {
            name: 'Recurring Court Booking',
          },
        })

        // Create subscription with explicit payment method
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: stripePrice.id }],
          default_payment_method: paymentMethodId,
          billing_cycle_anchor: Math.floor(billingAnchor.getTime() / 1000),
          proration_behavior: 'none',
          metadata: {
            playerid,
            terenid,
            clubid,
            dayOfWeek,
            startTime,
            endTime,
            price
          },
        })

        // Save recurring booking record
        await sql`
          INSERT INTO recurring_booking (
            playerid, terenid, clubid, day_of_week, start_time, end_time, price, stripe_subscription_id
          )
          VALUES (
            ${playerid}, ${terenid}, ${clubid}, ${dayOfWeek}, ${startTime}, ${endTime}, ${price}, ${subscription.id}
          )
        `

        await sql`
          INSERT INTO notification (userid, notitext, schedtime)
          VALUES (
            ${playerid},
            ${'RECURRING_BOOKING_CREATED: Your recurring booking has been set up. You will be charged 6 days before each future booking.'},
            NOW()
          )
        `

        console.log('Recurring booking created with subscription:', subscription.id)
      }

      console.log('[WEBHOOK] Booking confirmed successfully:', { terenid, playerid, starttime })
    } catch (error) {
      console.error('[WEBHOOK] Error processing payment:', error)
      console.error('[WEBHOOK] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      // Return 500 so Stripe knows to retry
      return NextResponse.json({ 
        error: 'Failed to process payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }
  }

  // Handle successful recurring payment
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as any
    const subscriptionId = invoice.subscription as string
    
    if (!subscriptionId) return NextResponse.json({ received: true })

    // Skip the initial invoice created when subscription is created
    // (first booking was already created in checkout.session.completed)
    if (invoice.billing_reason === 'subscription_create') {
      console.log('Skipping initial subscription invoice')
      return NextResponse.json({ received: true })
    }

    try {
      // Get recurring booking details
      const [recurring] = await sql`
        SELECT * FROM recurring_booking
        WHERE stripe_subscription_id = ${subscriptionId}
          AND is_active = true
      `

      if (!recurring) {
        console.log('No active recurring booking for subscription:', subscriptionId)
        return NextResponse.json({ received: true })
      }

      // Calculate next booking date (find next occurrence of day_of_week)
      const now = new Date()
      const targetDay = recurring.day_of_week === 7 ? 0 : recurring.day_of_week
      const currentDay = now.getUTCDay()
      const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7
      
      // Calculate next occurrence date
      const nextBookingDate = new Date(now.getTime() + (daysUntilTarget * 24 * 60 * 60 * 1000))
      const dateString = nextBookingDate.toISOString().split('T')[0]

      // Get current timezone offset for Europe/Zagreb (CET/CEST)
      // This accounts for daylight saving time automatically
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Zagreb',
        timeZoneName: 'longOffset'
      })
      const parts = formatter.formatToParts(nextBookingDate)
      const offsetPart = parts.find(p => p.type === 'timeZoneName')
      const offset = offsetPart?.value.replace('GMT', '') || '+01:00'

      // Construct timestamps with correct timezone offset
      const starttime = `${dateString}T${recurring.start_time}${offset}`
      const endtime = `${dateString}T${recurring.end_time}${offset}`

      // Create next booking
      await sql`
        INSERT INTO termin (playerid, terenid, clubid, starttime, endtime, confirmed, stripesessionid)
        VALUES (
          ${recurring.playerid},
          ${recurring.terenid},
          ${recurring.clubid},
          ${starttime},
          ${endtime},
          true,
          ${invoice.id}
        )
        ON CONFLICT DO NOTHING
      `

      // Notify player
      await sql`
        INSERT INTO notification (userid, notitext, schedtime)
        VALUES (
          ${recurring.playerid},
          ${'RECURRING_BOOKING_CONFIRMED: Your recurring booking for ' + nextBookingDate.toISOString().split('T')[0] + ' has been confirmed.'},
          NOW()
        )
      `

      // Create reminder
      await createBookingReminder(recurring.terenid, recurring.playerid, recurring.clubid, starttime)

      console.log('Recurring booking created for:', starttime)
    } catch (error) {
      console.error('Error creating recurring booking:', error)
    }
  }

  // Handle failed payment - cancel entire series
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as any
    const subscriptionId = invoice.subscription as string
    
    if (!subscriptionId) return NextResponse.json({ received: true })

    try {
      // Get recurring booking
      const [recurring] = await sql`
        SELECT * FROM recurring_booking
        WHERE stripe_subscription_id = ${subscriptionId}
          AND is_active = true
      `

      if (!recurring) return NextResponse.json({ received: true })

      // Cancel subscription
      await stripe.subscriptions.cancel(subscriptionId)

      // Mark as inactive
      await sql`
        UPDATE recurring_booking
        SET is_active = false, cancelled_at = NOW()
        WHERE recurringid = ${recurring.recurringid}
      `

      // Cancel future bookings
      await sql`
        DELETE FROM termin
        WHERE playerid = ${recurring.playerid}
          AND terenid = ${recurring.terenid}
          AND starttime > NOW()
          AND confirmed = true
      `

      // Notify player
      await sql`
        INSERT INTO notification (userid, notitext, schedtime)
        VALUES (
          ${recurring.playerid},
          ${'RECURRING_BOOKING_CANCELLED: Your recurring booking series has been cancelled due to payment failure.'},
          NOW()
        )
      `

      console.log('Recurring booking cancelled due to payment failure:', subscriptionId)
    } catch (error) {
      console.error('Error cancelling recurring booking:', error)
    }
  }

  return NextResponse.json({ received: true })
}
