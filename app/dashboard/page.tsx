import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import Header from '../components/Header'
import ClubDashboard from './ClubDashboard'

export default async function Dashboard() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/')
  }
  
  // Check if user exists in database
  const [user] = await sql`
    SELECT * FROM users WHERE userid = ${userId}
  `
  
  if (!user) {
    redirect('/choose-account-type')
  }

  // If club, fetch club information
  if (user.role === 'club') {
    const [club] = await sql`
      SELECT * FROM club WHERE userid = ${userId}
    `
    
    if (!club) {
      redirect('/setup-club')
    }

    return (
      <>
        <Header />
        <div className="min-h-screen p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <ClubDashboard userId={userId} club={club} />
          </div>
        </div>
      </>
    )
  }

  // Player dashboard
  return (
    <>
      <Header />
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Account</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">User ID:</span> {user.userid}
              </p>
              <p>
                <span className="font-medium">Account Type:</span>{' '}
                <span className="capitalize">{user.role}</span>
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Player Dashboard</h2>
            <p className="text-gray-600">
              Welcome! Here you can book courts and manage your bookings.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
