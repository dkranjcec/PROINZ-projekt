import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Header from '../components/Header'

export default async function CourtManagement() {
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

  if (user.role !== 'club') {
    redirect('/dashboard')
  }

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
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Court Management</h1>
            <Link href="/club-dashboard">
              <Button variant="secondary">
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Court management page - coming soon</p>
          </div>
        </div>
      </div>
    </>
  )
}
