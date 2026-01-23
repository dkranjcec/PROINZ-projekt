import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin-utils'
import AdminPanel from './AdminPanel'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminDashboard() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/')
  }

  const adminStatus = await isAdmin(userId)
  
  if (!adminStatus) {
    redirect('/dashboard')
  }

  return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage all clubs, players, courts, and bookings</p>
        </div>
        
        <AdminPanel />
      </div>
  )
}
