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

    const body = await request.json()
    const { terenid, clubid, starttime, endtime } = body

    // Get court details and price
    const [court] = await sql`
      SELECT t.*, c.clubname 
      FROM teren t
      JOIN club c ON t.userid = c.userid
      WHERE t.terenid = ${terenid}
    `

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    if (!court.price || court.price <= 0) {
      return NextResponse.json({ error: 'This court does not require payment' }, { status: 400 })
    }

    // Calculate duration and total price
    const start = new Date(starttime)
    const end = new Date(endtime)
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    const totalPrice = court.price * durationHours

    // Get base URL from request origin (works for both local and production)
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${court.terenname} - ${court.clubname}`,
              description: `Court booking for ${durationHours} hour${durationHours !== 1 ? 's' : ''}`,
            },
            unit_amount: Math.round(totalPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/book-court/${terenid}`,
      metadata: {
        terenid,
        clubid,
        playerid: userId,
        starttime,
        endtime,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
