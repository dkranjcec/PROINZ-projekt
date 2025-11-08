import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import SetupClubForm from './SetupClubForm'

export default async function SetupClub() {
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
  
  // Check if club information already exists
  const [existingClub] = await sql`
    SELECT * FROM club WHERE userid = ${userId}
  `
  
  // If club info already exists, redirect to dashboard
  if (existingClub) {
    redirect('/dashboard')
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-2">
          Set Up Your Club
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Please provide some basic information about your club
        </p>
        
        <SetupClubForm userId={userId} />
      </div>
    </div>
  )
}

