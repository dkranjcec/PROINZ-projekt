'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import ReviewForm from './ReviewForm'

interface ReviewButtonProps {
  clubid: string
  viewerRole: string
}

export default function ReviewButton({ clubid, viewerRole }: ReviewButtonProps) {
  const [canReview, setCanReview] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkReviewEligibility = async () => {
    if (viewerRole !== 'player') {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/review/can-review?clubid=${clubid}`)
      if (response.ok) {
        const data = await response.json()
        setCanReview(data.canReview)
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkReviewEligibility()
  }, [clubid, viewerRole])

  if (loading || !canReview || viewerRole !== 'player') {
    return null
  }

  return (
    <>
      <Button
        onClick={() => setShowReviewForm(true)}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Leave Review
      </Button>

      {showReviewForm && (
        <ReviewForm
          clubid={clubid}
          onClose={() => setShowReviewForm(false)}
          onReviewSubmitted={() => {
            // Could refresh reviews here if we display them on the page
            setShowReviewForm(false)
          }}
        />
      )}
    </>
  )
}
