import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import Header from '../components/Header'
import EditableClubDashboard from './EditableClubDashboard'

export default async function ClubDashboard() {
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

  if (user.role === 'player') {
    redirect('/dashboard')
  }

  const [club] = await sql`
    SELECT * FROM club WHERE userid = ${userId}
  `
  const workHours = await sql`
    SELECT * FROM workhours WHERE userid = ${userId} ORDER BY day_of_week
  `

  const clubPhotos = await sql`
    SELECT * FROM clubphoto WHERE userid = ${userId} ORDER BY photolink
    `
  const [content] = await sql`
    SELECT * FROM content WHERE userid = ${userId}
    `


  if (!club) {
    redirect('/setup-club')
  }

  return (
    <>
      <Header />
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Club Dashboard</h1>
            <a 
              href="/club-services" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              To Services
            </a>
          </div>
          
          <EditableClubDashboard 
            club={club} 
            workHours={workHours} 
            content={content}
            clubPhotos={clubPhotos}
          />
        </div>
      </div>
    </>
  )
}
