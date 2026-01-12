import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Header from '../components/Header'
import EditableClubServices from './EditableClubServices'

export default async function ClubServices() {
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

  if (user.role === 'player') {
    redirect('/dashboard')
  }


  const [club] = await sql`
    SELECT * FROM club WHERE userid = ${userId}
  `

  if (!club) {
    redirect('/setup-club')
  }


  const priceList = await sql`
    SELECT * FROM pricelist WHERE userid = ${userId} ORDER BY productid DESC
  `
  const lessons = await sql`
    SELECT * FROM lessons WHERE userid = ${userId} ORDER BY lessonid DESC
  `
  const subscriptions = await sql`
    SELECT * FROM subscriptions WHERE userid = ${userId} ORDER BY subid DESC
  `

  return (
    <>
      <Header />
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Club Services</h1>
            <Link href="/club-dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700">
                To Dashboard
              </Button>
            </Link>
          </div>
          
          <EditableClubServices 
            club={club as any}
            priceList={priceList as any}
            lessons={lessons as any}
            subscriptions={subscriptions as any}
          />
        </div>
      </div>
    </>
  )
}
