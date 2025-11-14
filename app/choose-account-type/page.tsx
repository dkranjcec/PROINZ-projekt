import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ChooseAccountType() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-center mb-2">
          Choose Your Account Type
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Select how you want to use PadelTime
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/create-account?type=player">
            <div className="border-2 border-gray-200 rounded-lg p-8 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer">
              <div className="text-4xl mb-4">🎾</div>
              <h2 className="text-2xl font-bold mb-2">Player</h2>
              <p className="text-gray-600">
                Book courts, find partners, and enjoy playing padel
              </p>
            </div>
          </Link>
          
          <Link href="/create-account?type=club">
            <div className="border-2 border-gray-200 rounded-lg p-8 hover:border-green-500 hover:shadow-lg transition-all cursor-pointer">
              <div className="text-4xl mb-4">🏢</div>
              <h2 className="text-2xl font-bold mb-2">Club</h2>
              <p className="text-gray-600">
                Manage your courts, bookings, and club operations
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
