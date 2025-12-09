import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'

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

  if (user.role === 'player') {
    redirect('/player-dashboard')
  }

  // Fallback if role is neither club nor player
  redirect('/choose-account-type')
}
