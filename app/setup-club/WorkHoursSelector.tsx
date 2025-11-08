'use client'

import { useState, useEffect } from 'react'

interface WorkHours {
  [key: string]: { start: string; end: string; closed: boolean }
}

interface WorkHoursSelectorProps {
  onChange: (hours: WorkHours) => void
  initialHours?: WorkHours
}

const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
]

export default function WorkHoursSelector({ onChange, initialHours }: WorkHoursSelectorProps) {
  const defaultHours: WorkHours = {
    monday: { start: '09:00', end: '18:00', closed: false },
    tuesday: { start: '09:00', end: '18:00', closed: false },
    wednesday: { start: '09:00', end: '18:00', closed: false },
    thursday: { start: '09:00', end: '18:00', closed: false },
    friday: { start: '09:00', end: '18:00', closed: false },
    saturday: { start: '09:00', end: '18:00', closed: false },
    sunday: { start: '09:00', end: '18:00', closed: false },
  }

  const [hours, setHours] = useState<WorkHours>(initialHours || defaultHours)

  // Call onChange when component mounts with initial hours
  useEffect(() => {
    if (!initialHours) {
      onChange(defaultHours)
    } else {
      onChange(initialHours)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [applyToAll, setApplyToAll] = useState(false)
  const [selectedDays, setSelectedDays] = useState<string[]>([])

  const updateHours = (day: string, field: 'start' | 'end' | 'closed', value: string | boolean) => {
    const newHours = {
      ...hours,
      [day]: {
        ...hours[day],
        [field]: value,
      },
    }
    setHours(newHours)
    onChange(newHours)
  }

  const handleApplyToAll = () => {
    if (selectedDays.length === 0) return

    const templateDay = selectedDays[0]
    const template = hours[templateDay]

    const newHours = { ...hours }
    selectedDays.forEach((day) => {
      newHours[day] = { ...template }
    })

    setHours(newHours)
    onChange(newHours)
    setSelectedDays([])
    setApplyToAll(false)
  }

  const handleSelectDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">Set working hours for each day</p>
        {selectedDays.length > 1 && (
          <button
            type="button"
            onClick={handleApplyToAll}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Apply {selectedDays[0]} hours to selected days
          </button>
        )}
      </div>

      <div className="space-y-3">
        {daysOfWeek.map((day) => (
          <div
            key={day.key}
            className={`flex items-center gap-4 p-3 border rounded-lg ${
              selectedDays.includes(day.key) ? 'border-green-500 bg-green-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 min-w-[120px]">
              <input
                type="checkbox"
                checked={selectedDays.includes(day.key)}
                onChange={() => handleSelectDay(day.key)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label className="font-medium text-gray-700 min-w-[80px]">{day.label}</label>
            </div>

            <div className="flex items-center gap-2 flex-1">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hours[day.key].closed}
                  onChange={(e) => updateHours(day.key, 'closed', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-600">Closed</span>
              </label>

              {!hours[day.key].closed && (
                <>
                  <input
                    type="time"
                    value={hours[day.key].start}
                    onChange={(e) => updateHours(day.key, 'start', e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={hours[day.key].end}
                    onChange={(e) => updateHours(day.key, 'end', e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

