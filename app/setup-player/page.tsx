import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function SetupPlayer() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/')
  }
  
  // Placeholder - will be implemented later
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-2">
          Set Up Your Player Profile
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Player setup page - coming soon
        </p>
      </div>
    </div>
  )
}

