import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import Header from '../components/Header'
import EditableClubServices from './EditableClubServices'

export default async function ClubServices() {
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

  if (!club) {
    redirect('/setup-club')
  }


  const priceList = await sql`
    SELECT * FROM pricelist WHERE userid = ${userId} ORDER BY productid DESC
  `
  const lessons = await sql`
    SELECT * FROM lessons WHERE userid = ${userId} ORDER BY lessonid DESC
  `
  const subscriptions = await sql`
    SELECT * FROM subscriptions WHERE userid = ${userId} ORDER BY subid DESC
  `

  return (
    <>
      <Header />
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Club Services</h1>
            <a 
              href="/club-dashboard" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              To Dashboard
            </a>
          </div>
          
          <EditableClubServices 
            club={club}
            priceList={priceList}
            lessons={lessons}
            subscriptions={subscriptions}
          />
        </div>
      </div>
    </>
  )
}
