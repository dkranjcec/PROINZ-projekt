import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notifications = await sql`
      SELECT 
        notiid,
        userid,
        notitext,
        schedtime::timestamptz as schedtime
      FROM notification 
      WHERE userid = ${userId}
      ORDER BY schedtime DESC
      LIMIT 20
    `

    return NextResponse.json({ 
      notifications,
      unreadCount: 0
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notiid = searchParams.get('notiid')

    if (!notiid) {
      return NextResponse.json({ error: 'Missing notiid' }, { status: 400 })
    }

    // Delete notification
    await sql`
      DELETE FROM notification 
      WHERE notiid = ${notiid} AND userid = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
