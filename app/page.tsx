import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {
  const { userId } = await auth()
  
  if (userId) {
    const [existingUser] = await sql`
      SELECT * FROM users WHERE userid = ${userId}
    `
    
    if (!existingUser) {
      redirect('/choose-account-type')
    }
    
    if (existingUser.role === 'admin') {
      redirect('/admin-dashboard')
    } else if (existingUser.role === 'club') {
      redirect('/club-dashboard')
    } else if (existingUser.role === 'player') {
      redirect('/dashboard')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-8" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <main className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            Welcome to PadelTime
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Book your padel court today!
          </p>
          
          {!userId && (
            <p className="text-gray-500">
              Please sign in to continue
            </p>
          )}
          
          {userId && (
            <p className="text-green-600">
              You&apos;re signed in! Redirecting to your dashboard...
            </p>
          )}
        </main>
      </div>
  )
}
