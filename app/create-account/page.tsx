import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'

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
  
  // Check if user already exists
  const [existingUser] = await sql`
    SELECT * FROM users WHERE userid = ${userId}
  `
  
  if (existingUser) {
    redirect('/dashboard')
  }
  
  // Create the user in the database
  await sql`
    INSERT INTO users (userid, role)
    VALUES (${userId}, ${accountType})
  `
  
  // Redirect to appropriate setup page based on account type
  if (accountType === 'club') {
    redirect('/setup-club')
  } else if (accountType === 'player') {
    redirect('/setup-player')
  } else {
    redirect('/dashboard')
  }
}
