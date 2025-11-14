'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EditableClubServicesProps {
  club: any
  priceList: any[]
  lessons: any[]
  subscriptions: any[]
}

export default function EditableClubServices({ club, priceList, lessons, subscriptions }: EditableClubServicesProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  
  const [editablePriceList, setEditablePriceList] = useState(priceList)
  const [newProductName, setNewProductName] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
  
  const [editableLessons, setEditableLessons] = useState(lessons)
  const [newLessonInfo, setNewLessonInfo] = useState('')
  const [newLessonPrice, setNewLessonPrice] = useState('')
  
  const [editableSubscriptions, setEditableSubscriptions] = useState(subscriptions)
  const [newSubInfo, setNewSubInfo] = useState('')
  const [newSubDuration, setNewSubDuration] = useState('')
  const [newSubPrice, setNewSubPrice] = useState('')
  
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addPriceItem() {
    if (newProductName.trim() && newProductPrice) {
      setEditablePriceList(prev => [{
        productname: newProductName,
        price: parseFloat(newProductPrice),
        userid: club.userid,
        productid: Date.now() // temporary ID
      }, ...prev])
      setNewProductName('')
      setNewProductPrice('')
    }
  }

  function removePriceItem(index: number) {
    setEditablePriceList(prev => prev.filter((_, i) => i !== index))
  }

  function addLesson() {
    if (newLessonInfo.trim() && newLessonPrice) {
      setEditableLessons(prev => [{
        lessoninfo: newLessonInfo,
        price: parseFloat(newLessonPrice),
        userid: club.userid,
        lessonid: Date.now()
      }, ...prev])
      setNewLessonInfo('')
      setNewLessonPrice('')
    }
  }

  function removeLesson(index: number) {
    setEditableLessons(prev => prev.filter((_, i) => i !== index))
  }

  function addSubscription() {
    if (newSubInfo.trim() && newSubDuration && newSubPrice) {
      setEditableSubscriptions(prev => [{
        subinfo: newSubInfo,
        duration: parseInt(newSubDuration),
        price: parseFloat(newSubPrice),
        userid: club.userid,
        subid: Date.now()
      }, ...prev])
      setNewSubInfo('')
      setNewSubDuration('')
      setNewSubPrice('')
    }
  }

  function removeSubscription(index: number) {
    setEditableSubscriptions(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/club/update-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceList: editablePriceList,
          lessons: editableLessons,
          subscriptions: editableSubscriptions,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update services')
      }

      setIsEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    setEditablePriceList(priceList)
    setEditableLessons(lessons)
    setEditableSubscriptions(subscriptions)
    setNewProductName('')
    setNewProductPrice('')
    setNewLessonInfo('')
    setNewLessonPrice('')
    setNewSubInfo('')
    setNewSubDuration('')
    setNewSubPrice('')
    setIsEditing(false)
    setError(null)
  }

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-end mb-4">
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Edit Services
          </button>
        ) : (
          <div className="space-x-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>


      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Price List</h2>
        {editablePriceList && editablePriceList.length > 0 ? (
          <div className="space-y-2 mb-4">
            {editablePriceList.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div>
                  <span className="font-medium text-gray-900">{item.productname}</span>
                  <span className="text-gray-600 ml-4">€{item.price}</span>
                </div>
                {isEditing && (
                  <button
                    onClick={() => removePriceItem(index)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mb-4">No price list items</p>
        )}
        
        {isEditing && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Add Item:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="Product name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="number"
                step="0.01"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value)}
                placeholder="Price..."
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={addPriceItem}
                disabled={!newProductName.trim() || !newProductPrice}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Lessons</h2>
        {editableLessons && editableLessons.length > 0 ? (
          <div className="space-y-2 mb-4">
            {editableLessons.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div>
                  <span className="font-medium text-gray-900">{item.lessoninfo}</span>
                  <span className="text-gray-600 ml-4">€{item.price}</span>
                </div>
                {isEditing && (
                  <button
                    onClick={() => removeLesson(index)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mb-4">No lessons</p>
        )}
        
        {isEditing && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Add Lesson:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLessonInfo}
                onChange={(e) => setNewLessonInfo(e.target.value)}
                placeholder="Lesson info..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="number"
                step="0.01"
                value={newLessonPrice}
                onChange={(e) => setNewLessonPrice(e.target.value)}
                placeholder="Price..."
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={addLesson}
                disabled={!newLessonInfo.trim() || !newLessonPrice}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Subscriptions</h2>
        {editableSubscriptions && editableSubscriptions.length > 0 ? (
          <div className="space-y-2 mb-4">
            {editableSubscriptions.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div>
                  <span className="font-medium text-gray-900">{item.subinfo}</span>
                  <span className="text-gray-600 ml-4">{item.duration} days</span>
                  <span className="text-gray-600 ml-4">€{item.price}</span>
                </div>
                {isEditing && (
                  <button
                    onClick={() => removeSubscription(index)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mb-4">No subscriptions</p>
        )}
        
        {isEditing && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Add Subscription:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubInfo}
                onChange={(e) => setNewSubInfo(e.target.value)}
                placeholder="Subscription info..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="number"
                value={newSubDuration}
                onChange={(e) => setNewSubDuration(e.target.value)}
                placeholder="Days..."
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="number"
                step="0.01"
                value={newSubPrice}
                onChange={(e) => setNewSubPrice(e.target.value)}
                placeholder="Price..."
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={addSubscription}
                disabled={!newSubInfo.trim() || !newSubDuration || !newSubPrice}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
