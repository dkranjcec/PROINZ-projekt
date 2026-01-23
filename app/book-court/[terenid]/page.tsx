import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import BookingCalendar from './BookingCalendar'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    SELECT terenid, playerid, clubid, starttime, endtime, confirmed
    FROM termin 
    WHERE terenid = ${terenid}
    ORDER BY starttime ASC
  `

  // Get work hours for this club
  const workHours = await sql<{
    day_of_week: number
    start_time: string
    end_time: string
  }[]>`
    SELECT day_of_week, start_time, end_time
    FROM workhours
    WHERE userid = ${court.userid}
    ORDER BY day_of_week ASC
  `

  // Get active recurring bookings for this court
  const recurringBookings = await sql<{
    recurringid: number
    playerid: string
    day_of_week: number
    start_time: string
    end_time: string
  }[]>`
    SELECT recurringid, playerid, day_of_week, start_time, end_time
    FROM recurring_booking
    WHERE terenid = ${terenid}
      AND is_active = true
  `

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link 
            href={`/club/${court.userid}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
                clipRule="evenodd" 
              />
            </svg>
            Back to Club
          </Link>
          
          <h1 className="text-3xl font-bold mb-2">Book {court.terenname}</h1>
          <p className="text-gray-600">{court.clubname}</p>
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            <span>Type: {court.type}</span>
            <span>Size: {court.size}</span>
            <span>Ground: {court.ground}</span>
            {court.price && <span className="font-semibold text-green-600">Price: €{court.price}/hour</span>}
          </div>
        </div>
        
        <BookingCalendar 
          courtId={terenid}
          courtName={court.terenname}
          clubId={court.userid}
          bookings={bookings}
          recurringBookings={recurringBookings}
          playerUserId={userId}
          courtPrice={court.price}
          workHours={workHours}
        />
      </div>
    </div>
  )
}
