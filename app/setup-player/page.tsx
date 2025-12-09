import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import SetupPlayerForm from './SetupPlayerForm'

export default async function SetupPlayer() {
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
  
  if (user.role !== 'player') {
    redirect('/dashboard')
  }
  
  const [existingPlayer] = await sql`
    SELECT * FROM player WHERE userid = ${userId}
  `
  
  if (existingPlayer) {
    redirect('/player-dashboard')
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-2">
          Set Up Your Player Profile
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Please provide some basic information about yourself
        </p>
        
        <SetupPlayerForm userId={userId} />
      </div>
    </div>
  )
}

