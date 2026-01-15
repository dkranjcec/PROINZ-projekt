import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Header from '../../components/Header'
import ReviewButton from './ReviewButton'

interface PageProps {
  params: Promise<{
    userid: string
  }>
}

export default async function ClubPage({ params }: PageProps) {
  const isTestMode = process.env.E2E_TESTING === 'true'
  let viewer: any = { role: 'player' }
  
  if (!isTestMode) {
    const { userId: viewerUserId } = await auth()
    
    if (!viewerUserId) {
      redirect('/')
    }
    
    const [viewerData] = await sql`
      SELECT * FROM users WHERE userid = ${viewerUserId}
    `
    
    if (!viewerData) {
      redirect('/choose-account-type')
    }
    
    viewer = viewerData
  }

  const { userid: clubUserId } = await params

  // Fetch club details
  const [club] = await sql`
    SELECT * FROM club WHERE userid = ${clubUserId}
  `

  if (!club) {
    redirect('/browse-clubs')
  }

  // Fetch club photos
  const clubPhotos = await sql`
    SELECT photolink FROM clubphoto WHERE userid = ${clubUserId}
  `

  // Fetch work hours
  const workHours = await sql`
    SELECT * FROM workhours WHERE userid = ${clubUserId} ORDER BY day_of_week ASC
  `

  // Fetch content
  const [content] = await sql`
    SELECT * FROM content WHERE userid = ${clubUserId}
  `

  // Fetch courts with photos
  const courts = await sql`
    SELECT * FROM teren WHERE userid = ${clubUserId} ORDER BY LOWER(terenname) ASC
  `

  const courtsWithPhotos = await Promise.all(
    courts.map(async (court) => {
      const photos = await sql`
        SELECT photolink FROM terenphoto WHERE terenid = ${court.terenid}
      `
      return {
        ...court,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        photos: photos.map((p: any) => p.photolink)
      }
    })
  )

  // Fetch services
  const priceList = await sql`
    SELECT * FROM pricelist WHERE userid = ${clubUserId} ORDER BY productid DESC
  `

  const lessons = await sql`
    SELECT * FROM lessons WHERE userid = ${clubUserId} ORDER BY lessonid DESC
  `

  const subscriptions = await sql`
    SELECT * FROM subscriptions WHERE userid = ${clubUserId} ORDER BY subid DESC
  `

  // Fetch reviews with player names
  const reviews = await sql`
    SELECT 
      c.rating, 
      c.commentary, 
      c.playerid,
      p.firstname,
      p.lastname
    FROM commentary c
    JOIN player p ON c.playerid = p.userid
    WHERE c.clubid = ${clubUserId}
    ORDER BY c.rating DESC
  `

  const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  function formatTime(time: string) {
    return time.substring(0, 5)
  }

  return (
    <>
      <Header />
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">{club.clubname}</h1>
            <div className="flex gap-3">
              <ReviewButton clubid={clubUserId} viewerRole={viewer.role} />
              <Link href="/browse-clubs">
                <Button variant="secondary">
                  Back to Browse
                </Button>
              </Link>
            </div>
          </div>

          {/* Club Photos */}
          {clubPhotos && clubPhotos.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Photos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {clubPhotos.map((photo: any, index: number) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={photo.photolink}
                      alt={`Club photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Information</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Address:</span>
                <p className="text-gray-900">{club.clubaddress}</p>
              </div>
            </div>
          </div>

          {/* Work Hours */}
          {workHours && workHours.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Work Hours</h2>
              <div className="space-y-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {workHours.map((wh: any) => (
                  <div key={wh.day_of_week} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="font-medium text-gray-700">{dayNames[wh.day_of_week]}</span>
                    <span className="text-gray-600">{formatTime(wh.start_time)} - {formatTime(wh.end_time)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Club Rules */}
          {club.rules && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Club Rules</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{club.rules}</p>
            </div>
          )}

          {/* Content */}
          {content?.contenttext && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">About</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{content.contenttext}</p>
            </div>
          )}

          {/* Courts */}
          {courtsWithPhotos && courtsWithPhotos.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Courts</h2>
              <div className="space-y-6">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {courtsWithPhotos.map((court: any) => (
                  <div key={court.terenid} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">{court.terenname}</h3>
                      {viewer.role === 'player' && (
                        <Link href={`/book-court/${court.terenid}`}>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Book Court
                          </Button>
                        </Link>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <span className="text-sm text-gray-500">Type:</span>
                        <p className="font-medium capitalize">{court.type}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Size:</span>
                        <p className="font-medium capitalize">{court.size}</p>
                      </div>
                      {court.ground && (
                        <div>
                          <span className="text-sm text-gray-500">Ground:</span>
                          <p className="font-medium">{court.ground}</p>
                        </div>
                      )}
                      {court.type === 'indoor' && court.height && (
                        <div>
                          <span className="text-sm text-gray-500">Height:</span>
                          <p className="font-medium">{court.height} cm</p>
                        </div>
                      )}
                      {court.type === 'outdoor' && court.lights && (
                        <div>
                          <span className="text-sm text-gray-500">Lights:</span>
                          <p className="font-medium capitalize">{court.lights}</p>
                        </div>
                      )}
                    </div>
                    {court.photos && court.photos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {court.photos.map((photo: string, photoIndex: number) => (
                          <div key={photoIndex} className="relative aspect-video rounded overflow-hidden border border-gray-200">
                            <img
                              src={photo}
                              alt={`${court.terenname} photo ${photoIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Reviews */}
          {reviews && reviews.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Reviews ({reviews.length})</h2>
              <div className="space-y-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {reviews.map((review: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{review.firstname} {review.lastname}</p>
                        <div className="flex items-center mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-xl ${
                                star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                          <span className="ml-2 text-sm text-gray-600">
                            {review.rating}/5
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.commentary && (
                      <p className="text-gray-700 mt-2 whitespace-pre-wrap">{review.commentary}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Services */}
          {(priceList.length > 0 || lessons.length > 0 || subscriptions.length > 0) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Services</h2>

              {priceList.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Price List</h3>
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {priceList.map((item: any) => (
                      <div key={item.productid} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <span className="font-medium text-gray-900">{item.productname}</span>
                        <span className="text-gray-600">€{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lessons.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Lessons</h3>
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {lessons.map((item: any) => (
                      <div key={item.lessonid} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <span className="font-medium text-gray-900">{item.lessoninfo}</span>
                        <span className="text-gray-600">€{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {subscriptions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Subscriptions</h3>
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {subscriptions.map((item: any) => (
                      <div key={item.subid} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <span className="font-medium text-gray-900">{item.subinfo}</span>
                        <div className="flex gap-4">
                          <span className="text-gray-600">{item.duration} days</span>
                          <span className="text-gray-600">€{item.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
