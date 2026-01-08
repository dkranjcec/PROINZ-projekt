import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import Header from '../components/Header'
import CourtBookingsManagement from './CourtBookingsManagement'

export default async function CourtBookingsPage() {
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

  if (user.role !== 'club') {
    redirect('/dashboard')
  }

  const [club] = await sql`
    SELECT * FROM club WHERE userid = ${userId}
  `

  if (!club) {
    redirect('/setup-club')
  }

  // Fetch all courts for this club
  const courts = await sql<{
    terenid: number
    terenname: string
  }[]>`
    SELECT terenid, terenname FROM teren 
    WHERE userid = ${userId} 
    ORDER BY LOWER(terenname) ASC
  `

  // Fetch all bookings for this club's courts
  const bookings = await sql<{
    terenid: number
    terenname: string
    playerid: string
    clubid: string
    starttime: string
    endtime: string
    confirmed: boolean
    firstname: string
    lastname: string
    phone_number: string
  }[]>`
    SELECT t.*, p.firstname, p.lastname, p.phone_number, teren.terenname
    FROM termin t
    JOIN player p ON t.playerid = p.userid
    JOIN teren ON t.terenid = teren.terenid
    WHERE t.clubid = ${userId}
    ORDER BY t.starttime ASC
  `

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Court Bookings</h1>
          <CourtBookingsManagement 
            courts={courts}
            bookings={bookings}
          />
        </div>
      </div>
    </div>
  )
}
