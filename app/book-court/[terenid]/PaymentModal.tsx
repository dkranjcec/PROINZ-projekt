'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface PaymentModalProps {
  courtName: string
  courtPrice: number
  duration: number // in hours
  onClose: () => void
  onPayInPerson: () => void
  onPayOnline: () => void
}

export default function PaymentModal({
  courtName,
  courtPrice,
  duration,
  onClose,
  onPayInPerson,
  onPayOnline
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const totalPrice = courtPrice * duration

  const handlePayInPerson = async () => {
    setLoading(true)
    try {
      await onPayInPerson()
    } finally {
      setLoading(false)
    }
  }

  const handlePayOnline = async () => {
    setLoading(true)
    try {
      await onPayOnline()
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
          <p className="text-lg font-bold text-green-600 mt-2">
            Total: €{totalPrice.toFixed(2)}
          </p>
        </div>

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
