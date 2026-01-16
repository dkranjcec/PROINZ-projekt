import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import Header from '../components/Header'
import EditablePlayerDashboard from './EditablePlayerDashboard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PlayerDashboard() {
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

  if (user.role === 'club') {
    redirect('/club-dashboard')
  }

  const [player] = await sql`
    SELECT * FROM player WHERE userid = ${userId}
  `

  if (!player) {
    redirect('/setup-player')
  }

  return (
    <>
      <Header />
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Player Dashboard</h1>
          </div>
          
          <EditablePlayerDashboard player={player as any} />
        </div>
      </div>
    </>
  )
}
