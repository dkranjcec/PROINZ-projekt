import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import Header from '../components/Header'
import ClubManagementTabs from './ClubManagementTabs'

export default async function ClubManagement() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/')
  }
  
  // Check if user exists and is a club
  const [user] = await sql`
    SELECT * FROM users WHERE userid = ${userId}
  `
  
  if (!user) {
    redirect('/choose-account-type')
  }
  
  if (user.role !== 'club') {
    redirect('/dashboard')
  }
  
  // Check if club information exists
  const [club] = await sql`
    SELECT * FROM club WHERE userid = ${userId}
  `
  
  if (!club) {
    redirect('/setup-club')
  }
  
  return (
    <>
      <Header />
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Club Management</h1>
          <p className="text-gray-600 mb-8">Manage your club's photos, content, lessons, subscriptions, and price list</p>
          
          <ClubManagementTabs userId={userId} />
        </div>
      </div>
    </>
  )
}

