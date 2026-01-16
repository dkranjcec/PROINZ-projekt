import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courts } = await request.json()

    if (!Array.isArray(courts)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    // Delete all photos first, then courts (to avoid foreign key issues)
    const existingCourts = await sql`SELECT terenid FROM teren WHERE userid = ${userId}`
    if (existingCourts.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const courtIds = existingCourts.map((c: any) => c.terenid)
      await sql`DELETE FROM terenphoto WHERE terenid = ANY(${courtIds})`
    }
    
    // Delete all existing courts for this user
    await sql`DELETE FROM teren WHERE userid = ${userId}`

    // Insert updated courts
    for (const court of courts) {
      const { terenname, type, size, ground, height, lights, price, photos } = court
      
      // Validate price is not negative
      if (price != null && price < 0) {
        return NextResponse.json({ error: 'Court prices cannot be negative. Please enter a valid price.' }, { status: 400 })
      }
      
      // Insert court
      const [insertedCourt] = await sql`
        INSERT INTO teren (userid, terenname, type, size, ground, height, lights, price)
        VALUES (
          ${userId},
          ${terenname},
          ${type},
          ${size},
          ${ground || null},
          ${type === 'indoor' ? height : null},
          ${type === 'outdoor' ? lights : null},
          ${price || null}
        )
        RETURNING terenid
      `

      // Insert photos if provided
      if (photos && Array.isArray(photos) && photos.length > 0) {
        for (const photolink of photos) {
          await sql`
            INSERT INTO terenphoto (terenid, photolink)
            VALUES (${insertedCourt.terenid}, ${photolink})
          `
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating courts:', error)
    return NextResponse.json({ error: 'Failed to update courts' }, { status: 500 })
  }
}
