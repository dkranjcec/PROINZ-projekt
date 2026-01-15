'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ReviewFormProps {
  clubid: string
  onClose: () => void
  onReviewSubmitted: () => void
}

export default function ReviewForm({ clubid, onClose, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [commentary, setCommentary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    // Fetch existing review if any
    const fetchReview = async () => {
      try {
        const response = await fetch(`/api/review?clubid=${clubid}`)
        if (response.ok) {
          const data = await response.json()
          if (data.review) {
            setRating(data.review.rating)
            setCommentary(data.review.commentary || '')
            setIsEditing(true)
          }
        }
      } catch (err) {
        console.error('Error fetching review:', err)
      }
    }

    fetchReview()
  }, [clubid])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clubid,
          rating,
          commentary,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit review')
      }

      onReviewSubmitted()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your review?')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/review?clubid=${clubid}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete review')
      }

      onReviewSubmitted()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete review')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Edit Your Review' : 'Leave a Review'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="text-4xl focus:outline-none transition-transform hover:scale-110"
                >
                  <span
                    className={
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment (optional)
            </label>
            <textarea
              value={commentary}
              onChange={(e) => setCommentary(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={4}
              placeholder="Share your experience with this club..."
              disabled={loading}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Review' : 'Submit Review'}
            </Button>
            {isEditing && (
              <Button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                variant="secondary"
                className="bg-red-50 hover:bg-red-100 text-red-700"
              >
                Delete
              </Button>
            )}
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
