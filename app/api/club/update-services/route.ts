import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceList, lessons, subscriptions } = await request.json()

    if (priceList !== undefined && Array.isArray(priceList)) {
      await sql`DELETE FROM pricelist WHERE userid = ${userId}`
      
      for (const item of priceList) {
        await sql`
          INSERT INTO pricelist (userid, productname, price)
          VALUES (${userId}, ${item.productname}, ${item.price})
        `
      }
    }

    if (lessons !== undefined && Array.isArray(lessons)) {
      await sql`DELETE FROM lessons WHERE userid = ${userId}`
      
      for (const item of lessons) {
        await sql`
          INSERT INTO lessons (userid, lessoninfo, price)
          VALUES (${userId}, ${item.lessoninfo}, ${item.price})
        `
      }
    }

    if (subscriptions !== undefined && Array.isArray(subscriptions)) {
      await sql`DELETE FROM subscriptions WHERE userid = ${userId}`
      
      for (const item of subscriptions) {
        await sql`
          INSERT INTO subscriptions (userid, subinfo, duration, price)
          VALUES (${userId}, ${item.subinfo}, ${item.duration}, ${item.price})
        `
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating services:', error)
    return NextResponse.json({ error: 'Failed to update services' }, { status: 500 })
  }
}
