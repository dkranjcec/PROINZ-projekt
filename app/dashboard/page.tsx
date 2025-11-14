import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import Header from '../components/Header'

export default async function Dashboard() {
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

  return (
    <>
      <Header />
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Player Dashboard</h1>
          
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
            <h2 className="text-xl font-semibold mb-2">Welcome, Player!</h2>
            <p className="text-gray-600">
              Here you can book courts and manage your bookings.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
