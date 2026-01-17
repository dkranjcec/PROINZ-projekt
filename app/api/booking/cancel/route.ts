import { auth } from '@clerk/nextjs/server'
import sql from '@/lib/db'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { deleteBookingReminder } from '@/lib/notifications'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { terenid, clubid, playerid, starttime } = body

    if (!terenid || !clubid || !playerid || !starttime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (playerid !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get booking details
    const [booking] = await sql`
      SELECT t.*, ter.price, ter.terenname, c.clubname
      FROM termin t
      JOIN teren ter ON t.terenid = ter.terenid
      JOIN club c ON t.clubid = c.userid
      WHERE t.terenid = ${terenid} 
        AND t.clubid = ${clubid} 
        AND t.playerid = ${playerid} 
        AND t.starttime = ${starttime}
    `

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if booking is at least 24 hours in the future
    const bookingStart = new Date(booking.starttime)
    const now = new Date()
    const hoursUntilBooking = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (hoursUntilBooking < 24) {
      return NextResponse.json({ 
        error: 'Bookings can only be cancelled at least 24 hours in advance' 
      }, { status: 400 })
    }

    // Check if this is a paid booking (has Stripe session)
    if (booking.stripesessionid) {
      // Handle paid booking with refund
      const start = new Date(booking.starttime)
      const end = new Date(booking.endtime)
      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      const bookingPrice = booking.price * durationHours
      const platformFee = 2.00
      const refundAmount = bookingPrice // Refund everything except the €2 fee

      try {
        // Get the Stripe session to find the payment intent
        const session = await stripe.checkout.sessions.retrieve(booking.stripesessionid)
        
        if (!session.payment_intent) {
          throw new Error('No payment intent found for this booking')
        }

        // Get the payment intent to find the charge
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string)
        
        if (!paymentIntent.latest_charge) {
          throw new Error('No charge found for this payment')
        }

        // Create refund (minus the €2 fee)
        const refund = await stripe.refunds.create({
          charge: paymentIntent.latest_charge as string,
          amount: Math.round(refundAmount * 100), // Refund amount in cents
        })

        // Delete the booking
        await sql`
          DELETE FROM termin 
          WHERE terenid = ${terenid} 
            AND clubid = ${clubid} 
            AND playerid = ${playerid} 
            AND starttime = ${starttime}
        `

        // Notify club
        await sql`
          INSERT INTO notification (userid, notitext, schedtime)
          VALUES (
            ${clubid},
            ${`Booking cancelled by player for ${booking.terenname} on ${bookingStart.toLocaleDateString()}`},
            NOW()
          )
        `

        return NextResponse.json({ 
          success: true,
          refunded: true,
          refundAmount: refundAmount,
          refundId: refund.id,
          message: `Booking cancelled. €${refundAmount.toFixed(2)} refunded (€${platformFee.toFixed(2)} fee retained).`
        })
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError)
        return NextResponse.json({ 
          error: 'Failed to process refund. Booking not cancelled. Please contact support.' 
        }, { status: 500 })
      }
    } else {
      // Handle in-person payment booking (no refund needed)
      try {
        // Delete the booking
        await sql`
          DELETE FROM termin 
          WHERE terenid = ${terenid} 
            AND clubid = ${clubid} 
            AND playerid = ${playerid} 
            AND starttime = ${starttime}
        `

        // Notify club
        await sql`
          INSERT INTO notification (userid, notitext, schedtime)
          VALUES (
            ${clubid},
            ${`Booking cancelled by player for ${booking.terenname} on ${bookingStart.toLocaleDateString()}`},
            NOW()
          )
        `

        return NextResponse.json({ 
          success: true,
          refunded: false,
          message: 'Booking cancelled successfully.'
        })
      } catch (error) {
        console.error('Error cancelling booking:', error)
        return NextResponse.json({ 
          error: 'Failed to cancel booking. Please try again.' 
        }, { status: 500 })
      }
    }
  } catch (error) {
    console.error('Error cancelling booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
