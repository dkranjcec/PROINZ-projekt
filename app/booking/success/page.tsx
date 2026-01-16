import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Header from '@/app/components/Header'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  searchParams: Promise<{
    session_id?: string
  }>
}

export default async function BookingSuccess({ searchParams }: PageProps) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/')
  }

  const params = await searchParams

  return (
    <>
      <Header />
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600">
              Your booking has been confirmed and paid.
            </p>
          </div>

          {params.session_id && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Payment ID</p>
              <p className="text-xs text-gray-600 font-mono break-all mt-1">
                {params.session_id}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link href="/dashboard" className="block">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/browse-clubs" className="block">
              <Button variant="secondary" className="w-full">
                Browse More Courts
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
