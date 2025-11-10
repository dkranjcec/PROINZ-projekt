'use client'

import { useState, useEffect } from 'react'
import { addSubscription, deleteSubscription, getSubscriptions } from './actions'

export default function SubscriptionsSection({ userId }: { userId: string }) {
  const [subscriptions, setSubscriptions] = useState<Array<{ subid: number; subinfo: string; duration: number; price: number }>>([])
  const [subInfo, setSubInfo] = useState('')
  const [duration, setDuration] = useState('')
  const [price, setPrice] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    loadSubscriptions()
  }, [])
  
  async function loadSubscriptions() {
    try {
      setIsLoading(true)
      const data = await getSubscriptions(userId)
      setSubscriptions(data.map(row => ({
        subid: row.subid as number,
        subinfo: row.subinfo as string,
        duration: row.duration as number,
        price: row.price as number
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions')
    } finally {
      setIsLoading(false)
    }
  }
  
  async function handleAddSubscription(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const durationNum = parseInt(duration)
    const priceNum = parseFloat(price)
    
    if (isNaN(durationNum) || durationNum < 1) {
      setError('Please enter a valid duration (in days)')
      setIsSubmitting(false)
      return
    }
    
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Please enter a valid price')
      setIsSubmitting(false)
      return
    }
    
    try {
      await addSubscription(userId, subInfo, durationNum, priceNum)
      setSubInfo('')
      setDuration('')
      setPrice('')
      await loadSubscriptions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subscription')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  async function handleDeleteSubscription(subId: number) {
    if (!confirm('Are you sure you want to delete this subscription?')) return
    
    try {
      await deleteSubscription(userId, subId)
      await loadSubscriptions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subscription')
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Subscriptions</h2>
        <p className="text-gray-600 mb-6">Manage your club's subscription plans</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleAddSubscription} className="mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="space-y-4">
            <div>
              <label htmlFor="subInfo" className="block text-sm font-medium text-gray-700 mb-2">
                Subscription Information *
              </label>
              <textarea
                id="subInfo"
                value={subInfo}
                onChange={(e) => setSubInfo(e.target.value)}
                rows={4}
                placeholder="Enter subscription details, features, benefits, etc..."
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (days) *
                </label>
                <input
                  type="number"
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                  placeholder="30"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Subscription'}
            </button>
          </div>
        </form>
        
        {isLoading ? (
          <p className="text-gray-500">Loading subscriptions...</p>
        ) : subscriptions.length === 0 ? (
          <p className="text-gray-500">No subscriptions added yet.</p>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <div key={sub.subid} className="border border-gray-200 rounded-lg p-4 flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-gray-800 mb-2 whitespace-pre-wrap">{sub.subinfo}</p>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Duration: {sub.duration} days</span>
                    <span className="text-lg font-semibold text-green-600">${sub.price.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteSubscription(sub.subid)}
                  className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

