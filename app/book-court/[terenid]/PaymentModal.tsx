'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface PaymentModalProps {
  courtName: string
  courtPrice: number
  duration: number // in hours
  canBeRecurring: boolean // true if 1 hour duration
  onClose: () => void
  onPayInPerson: (makeRecurring: boolean) => Promise<void>
  onPayOnline: (makeRecurring: boolean) => Promise<void>
}

export default function PaymentModal({
  courtName,
  courtPrice,
  duration,
  canBeRecurring,
  onClose,
  onPayInPerson,
  onPayOnline
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [makeRecurring, setMakeRecurring] = useState(false)
  const totalPrice = courtPrice * duration
  const platformFee = 2.00

  const handlePayInPerson = async () => {
    setLoading(true)
    try {
      await onPayInPerson(makeRecurring)
    } finally {
      setLoading(false)
    }
  }

  const handlePayOnline = async () => {
    setLoading(true)
    try {
      await onPayOnline(makeRecurring)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Booking Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Booking Details:</p>
          <p className="font-semibold text-gray-900">{courtName}</p>
          <p className="text-sm text-gray-600 mt-2">
            Duration: {duration} hour{duration !== 1 ? 's' : ''}
          </p>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span>Court rental ({duration}h)</span>
              <span>€{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Platform fee</span>
              <span>€{platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-green-600 mt-2 pt-2 border-t border-gray-300">
              <span>Total</span>
              <span>€{(totalPrice + platformFee).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {canBeRecurring && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={makeRecurring}
                onChange={(e) => setMakeRecurring(e.target.checked)}
                className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <p className="font-semibold text-gray-900">🔄 Make this recurring?</p>
                <p className="text-sm text-gray-600 mt-1">
                  Book this same time slot every week. You'll be charged 6 days before each booking.
                  {makeRecurring && (
                    <span className="block mt-2 text-blue-700 font-medium">
                      ✓ Weekly charge: €{(totalPrice + platformFee).toFixed(2)}
                    </span>
                  )}
                </p>
              </div>
            </label>
          </div>
        )}

        {!canBeRecurring && (
          <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded text-sm text-gray-600">
            💡 Recurring bookings require at least 1 hour
          </div>
        )}

        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-gray-700">Choose payment method:</p>
          
          <button
            onClick={handlePayInPerson}
            disabled={loading}
            className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">💵</div>
              <div>
                <p className="font-semibold text-gray-900">Pay in Person</p>
                <p className="text-sm text-gray-600">Pay at the club when you arrive. Booking will be pending until confirmed by the club.</p>
              </div>
            </div>
          </button>

          <button
            onClick={handlePayOnline}
            disabled={loading}
            className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">💳</div>
              <div>
                <p className="font-semibold text-gray-900">Pay Online</p>
                <p className="text-sm text-gray-600">Pay now with card. Booking will be automatically confirmed after payment.</p>
              </div>
            </div>
          </button>
        </div>

        <Button
          onClick={onClose}
          disabled={loading}
          variant="secondary"
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
