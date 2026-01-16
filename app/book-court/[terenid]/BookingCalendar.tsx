'use client'

import { useState, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import PaymentModal from './PaymentModal'

interface Booking {
  terenid: number
  playerid: string
  clubid: string
  starttime: string
  endtime: string
  confirmed?: boolean
}

interface BookingCalendarProps {
  courtId: string
  courtName: string
  clubId: string
  bookings: Booking[]
  playerUserId: string
  courtPrice?: number | null
}

export default function BookingCalendar({ courtId, courtName, clubId, bookings, playerUserId, courtPrice }: BookingCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pendingBooking, setPendingBooking] = useState<{ startStr: string; endStr: string; view: any } | null>(null)
  
  const [events] = useState(
    bookings.map(booking => {
      const isOwn = booking.playerid === playerUserId
      const isConfirmed = booking.confirmed
      
      let title = 'Booked'
      let bgColor = '#dc2626' // red for other's bookings
      let borderColor = '#b91c1c'
      
      if (isOwn) {
        title = isConfirmed ? 'Your Booking (Confirmed)' : 'Your Booking (Pending)'
        bgColor = isConfirmed ? '#16a34a' : '#f59e0b' // green if confirmed, amber if pending
        borderColor = isConfirmed ? '#15803d' : '#d97706'
      }
      
      return {
        id: `${booking.playerid}-${booking.starttime}`,
        title,
        start: booking.starttime,
        end: booking.endtime,
        backgroundColor: bgColor,
        borderColor: borderColor,
        extendedProps: {
          userId: booking.playerid,
          confirmed: booking.confirmed,
          starttime: booking.starttime
        }
      }
    })
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleDateSelect(selectInfo: any) {
    // If court has a price, show payment modal
    if (courtPrice && courtPrice > 0) {
      setPendingBooking(selectInfo)
      setShowPaymentModal(true)
    } else {
      // No price, create booking directly (pending confirmation)
      await createBooking(selectInfo, 'in_person')
    }
    
    selectInfo.view.calendar.unselect()
  }

  async function createBooking(selectInfo: any, paymentMethod: 'in_person' | 'online') {
    try {
      // For online payment, create Stripe checkout session
      if (paymentMethod === 'online') {
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            terenid: courtId,
            clubid: clubId,
            starttime: selectInfo.startStr,
            endtime: selectInfo.endStr,
          })
        })

        if (!response.ok) {
          const error = await response.json()
          alert(error.error || 'Failed to create payment session')
          return
        }

        const data = await response.json()
        
        // Redirect to Stripe checkout
        if (data.url) {
          window.location.href = data.url
          return
        }
      }

      // For in-person payment, create booking directly
      const response = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terenid: courtId,
          clubid: clubId,
          starttime: selectInfo.startStr,
          endtime: selectInfo.endStr,
          paymentMethod,
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to create booking')
        return
      }
      
      // Add event to calendar (pending for in-person)
      const calendarApi = selectInfo.view.calendar
      
      calendarApi.addEvent({
        id: `${playerUserId}-${selectInfo.startStr}`,
        title: 'Your Booking (Pending)',
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        backgroundColor: '#f59e0b',
        borderColor: '#d97706',
        extendedProps: {
          userId: playerUserId,
          confirmed: false,
          starttime: selectInfo.startStr
        }
      })

      alert('Booking created successfully!')
    } catch (error) {
      console.error('Error creating booking:', error)
      alert('Failed to create booking')
    }
  }

  function calculateDuration(startStr: string, endStr: string): number {
    const start = new Date(startStr)
    const end = new Date(endStr)
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60) // hours
  }

  async function handlePayInPerson() {
    if (pendingBooking) {
      await createBooking(pendingBooking, 'in_person')
      setShowPaymentModal(false)
      setPendingBooking(null)
    }
  }

  async function handlePayOnline() {
    if (pendingBooking) {
      await createBooking(pendingBooking, 'online')
      setShowPaymentModal(false)
      setPendingBooking(null)
    }
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleEventClick(clickInfo: any) {
    const event = clickInfo.event
    
    // Only allow deleting own bookings
    if (event.extendedProps.userId !== playerUserId) {
      alert('You can only delete your own bookings')
      return
    }

    if (confirm(`Delete booking: ${event.title}?`)) {
      try {
        const response = await fetch('/api/booking/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            terenid: courtId,
            clubid: clubId,
            playerid: playerUserId,
            starttime: event.extendedProps.starttime
          })
        })

        if (!response.ok) {
          const error = await response.json()
          alert(error.error || 'Failed to delete booking')
          return
        }

        event.remove()
        alert('Booking deleted successfully!')
      } catch (error) {
        console.error('Error deleting booking:', error)
        alert('Failed to delete booking')
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span>Your Confirmed Bookings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded"></div>
            <span>Your Pending Bookings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <span>Other Bookings</span>
          </div>
        </div>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay'
        }}
        slotMinTime="06:00:00"
        slotMaxTime="24:00:00"
        slotDuration="01:00:00"
        slotLabelInterval="01:00"
        allDaySlot={false}
        editable={false}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={events}
        select={handleDateSelect}
        eventClick={handleEventClick}
        height="auto"
        contentHeight={600}
      />

      <div className="mt-4 text-sm text-gray-600">
        <p>• Click and drag on the calendar to create a booking</p>
        {courtPrice && courtPrice > 0 ? (
          <p>• Choose payment method: pay in person (pending) or pay online (confirmed)</p>
        ) : (
          <p>• Your bookings are pending until confirmed by the club</p>
        )}
        <p>• Click on your booking to delete it</p>
      </div>

      {showPaymentModal && pendingBooking && courtPrice && (
        <PaymentModal
          courtName={courtName}
          courtPrice={courtPrice}
          duration={calculateDuration(pendingBooking.startStr, pendingBooking.endStr)}
          onClose={() => {
            setShowPaymentModal(false)
            setPendingBooking(null)
          }}
          onPayInPerson={handlePayInPerson}
          onPayOnline={handlePayOnline}
        />
      )}
    </div>
  )
}
