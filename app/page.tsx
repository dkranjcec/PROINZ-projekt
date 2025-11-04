import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import Header from './components/Header'

export default async function Home() {
  const { userId } = await auth()
  
  // If user is logged in, check if they exist in our database
  if (userId) {
    const [existingUser] = await sql`
      SELECT * FROM users WHERE userid = ${userId}
    `
    
    // If user doesn't exist in DB, redirect to account type selection
    if (!existingUser) {
      redirect('/choose-account-type')
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
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
    </>
  )
}
