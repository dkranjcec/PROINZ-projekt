import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import BookingCalendar from './BookingCalendar'

export default async function BookCourtPage({
  params,
}: {
  params: Promise<{ terenid: string }>
}) {
  const isTestMode = process.env.E2E_TESTING === 'true'
  let userId = 'test-user-id'
  
  if (!isTestMode) {
    const { userId: authUserId } = await auth()

    if (!authUserId) {
      redirect('/sign-in')
    }
    
    userId = authUserId
  }
  
  const { terenid } = await params

  // Get court details
  const courts = await sql`
    SELECT t.*, c.clubname 
    FROM teren t
    JOIN club c ON t.userid = c.userid
    WHERE t.terenid = ${terenid}
  `
  
  const court = courts[0]
  
  if (!court) {
    return <div>Court not found</div>
  }

  // Get existing bookings for this court
  const bookings = await sql<{
    terenid: number
    playerid: string
    clubid: string
    starttime: string
    endtime: string
    confirmed: boolean
  }[]>`
    SELECT * FROM termin 
    WHERE terenid = ${terenid}
    ORDER BY starttime ASC
  `

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Book {court.terenname}</h1>
          <p className="text-gray-600">{court.clubname}</p>
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            <span>Type: {court.type}</span>
            <span>Size: {court.size}</span>
            <span>Ground: {court.ground}</span>
          </div>
        </div>
        
        <BookingCalendar 
          courtId={terenid}
          courtName={court.terenname}
          clubId={court.userid}
          bookings={bookings}
          playerUserId={userId}
        />
      </div>
    </div>
  )
}
