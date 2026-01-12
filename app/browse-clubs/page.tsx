import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Header from '../components/Header'
import BrowseClubsList from './BrowseClubsList'

export default async function BrowseClubs() {
  const isTestMode = process.env.E2E_TESTING === 'true'
  
  if (!isTestMode) {
    const { userId } = await auth()
    
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

  // Fetch all clubs sorted alphabetically
  const clubs = await sql`
    SELECT userid, clubname, clubaddress FROM club ORDER BY LOWER(clubname) ASC
  `

  return (
    <>
      <Header />
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
          <BrowseClubsList clubs={clubs as any} />
        </div>
      </div>
    </>
  )
}
