import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import BrowseClubsList from './BrowseClubsList'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BrowseClubs() {
  const isTestMode = process.env.E2E_TESTING === 'true'
  let userId = 'test-user-id'
  
  if (!isTestMode) {
    const authResult = await auth()
    userId = authResult.userId || ''
    
    if (!userId) {
      redirect('/')
    }
    
    const [user] = await sql`
      SELECT * FROM users WHERE userid = ${userId}
    `
    
    if (!user) {
      redirect('/choose-account-type')
    }

    if (user.role !== 'player') {
      redirect('/dashboard')
    }
  }

  // Fetch player data (only preferred times, location from browser)
  const [player] = await sql<{
    preferred_time_start: string | null
    preferred_time_end: string | null
  }[]>`
    SELECT preferred_time_start, preferred_time_end
    FROM player
    WHERE userid = ${userId}
  `

  // Fetch all clubs with coordinates
  const clubs = await sql`
    SELECT c.userid, c.clubname, c.clubaddress, c.latitude, c.longitude
    FROM club c
    ORDER BY LOWER(c.clubname) ASC
  `

  // Fetch work hours for all clubs
  const allWorkHours = await sql`
    SELECT userid, day_of_week, start_time, end_time
    FROM workhours
    ORDER BY userid, day_of_week
  `

  // Group work hours by club
  const workHoursByClub: Record<string, any[]> = {}
  allWorkHours.forEach((wh: any) => {
    if (!workHoursByClub[wh.userid]) {
      workHoursByClub[wh.userid] = []
    }
    workHoursByClub[wh.userid].push(wh)
  })

  return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Browse Clubs</h1>
            <Link href="/player-dashboard">
              <Button variant="secondary">
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <BrowseClubsList 
            clubs={clubs as any} 
            playerData={player || null}
            workHoursByClub={workHoursByClub}
          />
        </div>
      </div>
  )
}
