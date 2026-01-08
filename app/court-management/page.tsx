import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Header from '../components/Header'
import EditableCourtManagement from './EditableCourtManagement'

export default async function CourtManagement() {
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

  // Fetch courts with their photos
  const courts = await sql`
    SELECT * FROM teren WHERE userid = ${userId} ORDER BY LOWER(terenname) ASC
  `

  // Fetch all photos for these courts
  const courtsWithPhotos = await Promise.all(
    courts.map(async (court) => {
      const photos = await sql`
        SELECT photolink FROM terenphoto WHERE terenid = ${court.terenid}
      `
      return {
        ...court,
        photos: photos.map((p: any) => p.photolink)
      }
    })
  )

  return (
    <>
      <Header />
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Court Management</h1>
            <Link href="/club-dashboard">
              <Button variant="secondary">
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <EditableCourtManagement courts={courtsWithPhotos} />
        </div>
      </div>
    </>
  )
}
