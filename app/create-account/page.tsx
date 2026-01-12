import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CreateAccount({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { userId } = await auth()
  const params = await searchParams
  
  if (!userId) {
    redirect('/')
  }
  
  const accountType = params.type
  
  if (accountType !== 'player' && accountType !== 'club') {
    redirect('/choose-account-type')
  }
  
  
  const [existingUser] = await sql`
    SELECT * FROM users WHERE userid = ${userId}
  `
  
  if (existingUser) {
    
    if (existingUser.role === 'club') {
      redirect('/club-dashboard')
    } else {
      redirect('/dashboard')
    }
  }
  
  try {
    await sql`
      INSERT INTO users (userid, role)
      VALUES (${userId}, ${accountType})
    `
  } catch {
    console.log('User may already exist, continuing...')
  }
  
  if (accountType === 'club') {
    redirect('/setup-club')
  } else if (accountType === 'player') {
    redirect('/setup-player')
  } else {
    redirect('/dashboard')
  }
}
