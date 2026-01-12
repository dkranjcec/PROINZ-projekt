'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Court {
  terenid: number
  terenname: string
}

interface Booking {
  terenid: number
  terenname: string
  playerid: string
  clubid: string
  starttime: string
  endtime: string
  confirmed: boolean
  firstname: string
  lastname: string
  phone_number: string
}

interface CourtBookingsManagementProps {
  courts: Court[]
  bookings: Booking[]
}

export default function CourtBookingsManagement({ courts, bookings }: CourtBookingsManagementProps) {
  const [selectedCourt, setSelectedCourt] = useState<string>('all')
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all')
  const [bookingList, setBookingList] = useState(bookings)
  const [confirmingBooking, setConfirmingBooking] = useState<string | null>(null)

  const filteredBookings = bookingList.filter(booking => {
    const courtMatch = selectedCourt === 'all' || booking.terenid.toString() === selectedCourt
    const statusMatch = 
      filter === 'all' ||
      (filter === 'pending' && !booking.confirmed) ||
      (filter === 'confirmed' && booking.confirmed)
    
    return courtMatch && statusMatch
  })

  async function confirmBooking(booking: Booking) {
    setConfirmingBooking(`${booking.playerid}-${booking.starttime}`)
    
    try {
      const response = await fetch('/api/booking/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terenid: booking.terenid,
          playerid: booking.playerid,
          starttime: booking.starttime
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to confirm booking')
        return
      }

      // Update local state
      setBookingList(prev => 
        prev.map(b => 
          b.terenid === booking.terenid && 
          b.playerid === booking.playerid && 
          b.starttime === booking.starttime
            ? { ...b, confirmed: true }
            : b
        )
      )

      alert('Booking confirmed successfully!')
    } catch (error) {
      console.error('Error confirming booking:', error)
      alert('Failed to confirm booking')
    } finally {
      setConfirmingBooking(null)
    }
  }

  async function deleteBooking(booking: Booking) {
    if (!confirm(`Delete booking for ${booking.firstname} ${booking.lastname}?`)) {
      return
    }

    try {
      const response = await fetch('/api/booking/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terenid: booking.terenid,
          clubid: booking.clubid,
          playerid: booking.playerid,
          starttime: booking.starttime
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to delete booking')
        return
      }

      // Update local state
      setBookingList(prev => 
        prev.filter(b => 
          !(b.terenid === booking.terenid && 
            b.playerid === booking.playerid && 
            b.starttime === booking.starttime)
        )
      )

      alert('Booking deleted successfully!')
    } catch (error) {
      console.error('Error deleting booking:', error)
      alert('Failed to delete booking')
    }
  }

  function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const pendingCount = bookingList.filter(b => !b.confirmed).length
  const confirmedCount = bookingList.filter(b => b.confirmed).length

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Court</label>
            <Select value={selectedCourt} onValueChange={setSelectedCourt}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courts</SelectItem>
                {courts.map(court => (
                  <SelectItem key={court.terenid} value={court.terenid.toString()}>
                    {court.terenname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <Select value={filter} onValueChange={(v) => setFilter(v as 'all' | 'pending' | 'confirmed')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="pending">Pending ({pendingCount})</SelectItem>
                <SelectItem value="confirmed">Confirmed ({confirmedCount})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No bookings found</p>
          ) : (
            filteredBookings.map((booking) => (
              <div 
                key={`${booking.terenid}-${booking.playerid}-${booking.starttime}`}
                className={`border rounded-lg p-4 ${
                  booking.confirmed 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-amber-300 bg-amber-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{booking.terenname}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        booking.confirmed 
                          ? 'bg-green-600 text-white' 
                          : 'bg-amber-500 text-white'
                      }`}>
                        {booking.confirmed ? 'Confirmed' : 'Pending'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                      <div>
                        <span className="font-medium">Player:</span> {booking.firstname} {booking.lastname}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {booking.phone_number}
                      </div>
                      <div>
                        <span className="font-medium">Start:</span> {formatDateTime(booking.starttime)}
                      </div>
                      <div>
                        <span className="font-medium">End:</span> {formatDateTime(booking.endtime)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {!booking.confirmed && (
                      <Button
                        onClick={() => confirmBooking(booking)}
                        disabled={confirmingBooking === `${booking.playerid}-${booking.starttime}`}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {confirmingBooking === `${booking.playerid}-${booking.starttime}` 
                          ? 'Confirming...' 
                          : 'Confirm'}
                      </Button>
                    )}
                    <Button
                      onClick={() => deleteBooking(booking)}
                      variant="destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
