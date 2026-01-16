import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import SetupClubForm from './SetupClubForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SetupClub() {
  const isTestMode = process.env.E2E_TESTING === 'true'
  let userId = 'test-user-id'
  
  if (!isTestMode) {
    const { userId: authUserId } = await auth()
    
    if (!authUserId) {
      redirect('/')
    }
    
    userId = authUserId

    const [user] = await sql`
      SELECT * FROM users WHERE userid = ${userId}
    `
    
    if (!user) {
      redirect('/choose-account-type')
    }
    
    if (user.role !== 'club') {
      redirect('/dashboard')
    }
    
    const [existingClub] = await sql`
      SELECT * FROM club WHERE userid = ${userId}
    `
    

    if (existingClub) {
      redirect('/club-dashboard')
    }
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

