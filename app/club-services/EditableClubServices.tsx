'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { BookOpen, Calendar } from 'lucide-react'

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
        price: parseFloat(newProductPrice.replace(',', '.')),
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
        price: parseFloat(newLessonPrice.replace(',', '.')),
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
        price: parseFloat(newSubPrice.replace(',', '.')),
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
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            Edit Services
          </Button>
        ) : (
          <div className="space-x-2">
            <Button
              onClick={handleCancel}
              disabled={isSaving}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>


      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Price List</h2>
        {editablePriceList && editablePriceList.length > 0 ? (
          <div className="space-y-2 mb-4">
            {editablePriceList.map((item: any, index: number) => (
              <div key={index} className="flex gap-2 items-center">
                {isEditing ? (
                  <>
                    <InputGroup className="flex-1">
                      <InputGroupInput
                        type="text"
                        value={item.productname}
                        onChange={(e) => {
                          const updated = [...editablePriceList]
                          updated[index].productname = e.target.value
                          setEditablePriceList(updated)
                        }}
                        placeholder="Product name..."
                      />
                    </InputGroup>
                    <InputGroup className="w-32">
                      <InputGroupInput
                        type="text"
                        value={item.price}
                        onChange={(e) => {
                          const updated = [...editablePriceList]
                          updated[index].price = e.target.value
                          setEditablePriceList(updated)
                        }}
                        onBlur={(e) => {
                          const updated = [...editablePriceList]
                          updated[index].price = parseFloat(e.target.value.replace(',', '.')) || 0
                          setEditablePriceList(updated)
                        }}
                        placeholder="Price..."
                      />
                    </InputGroup>
                    <Button
                      onClick={() => removePriceItem(index)}
                      variant="destructive"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </>
                ) : (
                  <div className="flex-1 p-3 border border-gray-200 rounded-lg bg-gray-50 flex justify-between items-center">
                    <span className="font-medium text-gray-900">{item.productname}</span>
                    <span className="text-gray-600">€{item.price}</span>
                  </div>
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
              <InputGroup className="flex-1">
                <InputGroupInput
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Product name..."
                />
              </InputGroup>
              <InputGroup className="w-32">
                <InputGroupInput
                  type="text"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  placeholder="Price..."
                />
              </InputGroup>
              <Button
                onClick={addPriceItem}
                disabled={!newProductName.trim() || !newProductPrice}
                className="bg-green-500 hover:bg-green-600"
              >
                Add
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Lessons</h2>
        {editableLessons && editableLessons.length > 0 ? (
          <div className="space-y-2 mb-4">
            {editableLessons.map((item: any, index: number) => (
              <div key={index} className="flex gap-2 items-center">
                {isEditing ? (
                  <>
                    <InputGroup className="flex-1">
                      <InputGroupAddon>
                        <BookOpen className="size-4" />
                      </InputGroupAddon>
                      <InputGroupInput
                        type="text"
                        value={item.lessoninfo}
                        onChange={(e) => {
                          const updated = [...editableLessons]
                          updated[index].lessoninfo = e.target.value
                          setEditableLessons(updated)
                        }}
                        placeholder="Lesson info..."
                      />
                    </InputGroup>
                    <InputGroup className="w-32">
                      <InputGroupInput
                        type="text"
                        value={item.price}
                        onChange={(e) => {
                          const updated = [...editableLessons]
                          updated[index].price = e.target.value
                          setEditableLessons(updated)
                        }}
                        onBlur={(e) => {
                          const updated = [...editableLessons]
                          updated[index].price = parseFloat(e.target.value.replace(',', '.')) || 0
                          setEditableLessons(updated)
                        }}
                        placeholder="Price..."
                      />
                    </InputGroup>
                    <Button
                      onClick={() => removeLesson(index)}
                      variant="destructive"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </>
                ) : (
                  <div className="flex-1 p-3 border border-gray-200 rounded-lg bg-gray-50 flex justify-between items-center">
                    <span className="font-medium text-gray-900">{item.lessoninfo}</span>
                    <span className="text-gray-600">€{item.price}</span>
                  </div>
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
              <InputGroup className="flex-1">
                <InputGroupAddon>
                  <BookOpen className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  value={newLessonInfo}
                  onChange={(e) => setNewLessonInfo(e.target.value)}
                  placeholder="Lesson info..."
                />
              </InputGroup>
              <InputGroup className="w-32">
                <InputGroupInput
                  type="text"
                  value={newLessonPrice}
                  onChange={(e) => setNewLessonPrice(e.target.value)}
                  placeholder="Price..."
                />
              </InputGroup>
              <Button
                onClick={addLesson}
                disabled={!newLessonInfo.trim() || !newLessonPrice}
                className="bg-green-500 hover:bg-green-600"
              >
                Add
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Subscriptions</h2>
        {editableSubscriptions && editableSubscriptions.length > 0 ? (
          <div className="space-y-2 mb-4">
            {editableSubscriptions.map((item: any, index: number) => (
              <div key={index} className="flex gap-2 items-center">
                {isEditing ? (
                  <>
                    <InputGroup className="flex-1">
                      <InputGroupInput
                        type="text"
                        value={item.subinfo}
                        onChange={(e) => {
                          const updated = [...editableSubscriptions]
                          updated[index].subinfo = e.target.value
                          setEditableSubscriptions(updated)
                        }}
                        placeholder="Subscription info..."
                      />
                    </InputGroup>
                    <InputGroup className="w-28">
                      <InputGroupAddon>
                        <Calendar className="size-4" />
                      </InputGroupAddon>
                      <InputGroupInput
                        type="text"
                        value={item.duration}
                        onChange={(e) => {
                          const updated = [...editableSubscriptions]
                          updated[index].duration = e.target.value
                          setEditableSubscriptions(updated)
                        }}
                        onBlur={(e) => {
                          const updated = [...editableSubscriptions]
                          updated[index].duration = parseInt(e.target.value) || 0
                          setEditableSubscriptions(updated)
                        }}
                        placeholder="Days..."
                      />
                    </InputGroup>
                    <InputGroup className="w-32">
                      <InputGroupInput
                        type="text"
                        value={item.price}
                        onChange={(e) => {
                          const updated = [...editableSubscriptions]
                          updated[index].price = e.target.value
                          setEditableSubscriptions(updated)
                        }}
                        onBlur={(e) => {
                          const updated = [...editableSubscriptions]
                          updated[index].price = parseFloat(e.target.value.replace(',', '.')) || 0
                          setEditableSubscriptions(updated)
                        }}
                        placeholder="Price..."
                      />
                    </InputGroup>
                    <Button
                      onClick={() => removeSubscription(index)}
                      variant="destructive"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </>
                ) : (
                  <div className="flex-1 p-3 border border-gray-200 rounded-lg bg-gray-50 flex justify-between items-center">
                    <span className="font-medium text-gray-900">{item.subinfo}</span>
                    <div className="flex gap-4">
                      <span className="text-gray-600">{item.duration} days</span>
                      <span className="text-gray-600">€{item.price}</span>
                    </div>
                  </div>
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
              <InputGroup className="flex-1">
                <InputGroupInput
                  type="text"
                  value={newSubInfo}
                  onChange={(e) => setNewSubInfo(e.target.value)}
                  placeholder="Subscription info..."
                />
              </InputGroup>
              <InputGroup className="w-28">
                <InputGroupAddon>
                  <Calendar className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  value={newSubDuration}
                  onChange={(e) => setNewSubDuration(e.target.value)}
                  placeholder="Days..."
                />
              </InputGroup>
              <InputGroup className="w-32">
                <InputGroupInput
                  type="text"
                  value={newSubPrice}
                  onChange={(e) => setNewSubPrice(e.target.value)}
                  placeholder="Price..."
                />
              </InputGroup>
              <Button
                onClick={addSubscription}
                disabled={!newSubInfo.trim() || !newSubDuration || !newSubPrice}
                className="bg-green-500 hover:bg-green-600"
              >
                Add
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
