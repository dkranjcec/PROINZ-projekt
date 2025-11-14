'use client'

import { useState, useEffect } from 'react'
import { saveContent, getContent } from './actions'

export default function ContentSection({ userId }: { userId: string }) {
  const [contentText, setContentText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  useEffect(() => {
    loadContent()
  }, [])
  
  async function loadContent() {
    try {
      setIsLoading(true)
      const content = await getContent(userId)
      if (content) {
        setContentText((content as { contenttext: string }).contenttext || '')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content')
    } finally {
      setIsLoading(false)
    }
  }
  
  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)
    
    try {
      await saveContent(userId, contentText)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* cursor composer 1 model was used */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Club Content</h2>
        <p className="text-gray-600 mb-6">Add or edit your club's content and description</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            Content saved successfully!
          </div>
        )}
        
        {isLoading ? (
          <p className="text-gray-500">Loading content...</p>
        ) : (
          <form onSubmit={handleSave}>
            <textarea
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              rows={12}
              placeholder="Enter your club content, description, announcements, etc..."
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Content'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

