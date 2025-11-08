'use client'

import { useState, useEffect } from 'react'
import { addLesson, deleteLesson, getLessons } from './actions'

export default function LessonsSection({ userId }: { userId: string }) {
  const [lessons, setLessons] = useState<Array<{ lessonid: number; lessoninfo: string; price: number }>>([])
  const [lessonInfo, setLessonInfo] = useState('')
  const [price, setPrice] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    loadLessons()
  }, [])
  
  async function loadLessons() {
    try {
      setIsLoading(true)
      const data = await getLessons(userId)
      setLessons(data as Array<{ lessonid: number; lessoninfo: string; price: number }>)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lessons')
    } finally {
      setIsLoading(false)
    }
  }
  
  async function handleAddLesson(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Please enter a valid price')
      setIsSubmitting(false)
      return
    }
    
    try {
      await addLesson(userId, lessonInfo, priceNum)
      setLessonInfo('')
      setPrice('')
      await loadLessons()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add lesson')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  async function handleDeleteLesson(lessonId: number) {
    if (!confirm('Are you sure you want to delete this lesson?')) return
    
    try {
      await deleteLesson(userId, lessonId)
      await loadLessons()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lesson')
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Lessons</h2>
        <p className="text-gray-600 mb-6">Manage your club's lessons</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleAddLesson} className="mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="space-y-4">
            <div>
              <label htmlFor="lessonInfo" className="block text-sm font-medium text-gray-700 mb-2">
                Lesson Information *
              </label>
              <textarea
                id="lessonInfo"
                value={lessonInfo}
                onChange={(e) => setLessonInfo(e.target.value)}
                rows={4}
                placeholder="Enter lesson description, duration, instructor info, etc..."
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
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Lesson'}
            </button>
          </div>
        </form>
        
        {isLoading ? (
          <p className="text-gray-500">Loading lessons...</p>
        ) : lessons.length === 0 ? (
          <p className="text-gray-500">No lessons added yet.</p>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <div key={lesson.lessonid} className="border border-gray-200 rounded-lg p-4 flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-gray-800 mb-2 whitespace-pre-wrap">{lesson.lessoninfo}</p>
                  <p className="text-lg font-semibold text-green-600">${lesson.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => handleDeleteLesson(lesson.lessonid)}
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

