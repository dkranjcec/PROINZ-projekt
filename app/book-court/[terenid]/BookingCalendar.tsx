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

interface WorkHour {
  day_of_week: number
  start_time: string
  end_time: string
}

interface RecurringBooking {
  recurringid: number
  playerid: string
  day_of_week: number
  start_time: string
  end_time: string
}

interface BookingCalendarProps {
  courtId: string
  courtName: string
  clubId: string
  bookings: Booking[]
  recurringBookings: RecurringBooking[]
  playerUserId: string
  courtPrice?: number | null
  workHours: WorkHour[]
}

export default function BookingCalendar({ courtId, courtName, clubId, bookings, recurringBookings, playerUserId, courtPrice, workHours }: BookingCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pendingBooking, setPendingBooking] = useState<{ startStr: string; endStr: string; view: any } | null>(null)
  
  // Convert work hours to FullCalendar businessHours format
  // Database: day_of_week 1=Monday, 2=Tuesday, ..., 7=Sunday
  // FullCalendar: daysOfWeek 0=Sunday, 1=Monday, ..., 6=Saturday
  const businessHours = workHours.map(wh => ({
    daysOfWeek: [wh.day_of_week === 7 ? 0 : wh.day_of_week], // Convert Sunday from 7 to 0
    startTime: wh.start_time.substring(0, 5), // Format HH:MM
    endTime: wh.end_time.substring(0, 5)
  }))
  
  // Generate events including recurring bookings
  // FullCalendar expects this specific function signature
  const generateEvents = (fetchInfo: any, successCallback: any, failureCallback: any) => {
    try {
      const events = []

      // Add actual bookings
      for (const booking of bookings) {
        const isOwn = booking.playerid === playerUserId
        const isConfirmed = booking.confirmed
        
        let title = 'Booked'
        let bgColor = '#dc2626'
        let borderColor = '#b91c1c'
        
        if (isOwn) {
          title = isConfirmed ? 'Your Booking (Confirmed)' : 'Your Booking (Pending)'
          bgColor = isConfirmed ? '#16a34a' : '#f59e0b'
          borderColor = isConfirmed ? '#15803d' : '#d97706'
        }
        
        events.push({
          id: `booking-${booking.playerid}-${booking.starttime}`,
          title,
          start: booking.starttime,
          end: booking.endtime,
          backgroundColor: bgColor,
          borderColor: borderColor,
          extendedProps: {
            userId: booking.playerid,
            confirmed: booking.confirmed,
            starttime: booking.starttime,
            isRecurring: false
          }
        })
      }

      // Add virtual events for recurring bookings
      for (const recurring of recurringBookings) {
        const isOwn = recurring.playerid === playerUserId
        
        // Generate occurrences for calendar visible range
        const current = new Date(fetchInfo.start)
        const end = new Date(fetchInfo.end)
        
        while (current <= end) {
          const currentDay = current.getUTCDay()
          const targetDay = recurring.day_of_week === 7 ? 0 : recurring.day_of_week
          
          if (currentDay === targetDay) {
            const dateString = current.toISOString().split('T')[0]
            
            // Get timezone offset
            const formatter = new Intl.DateTimeFormat('en-US', {
              timeZone: 'Europe/Zagreb',
              timeZoneName: 'longOffset'
            })
            const parts = formatter.formatToParts(current)
            const offsetPart = parts.find(p => p.type === 'timeZoneName')
            const offset = offsetPart?.value.replace('GMT', '') || '+01:00'
            
            const eventStart = `${dateString}T${recurring.start_time}${offset}`
            const eventEnd = `${dateString}T${recurring.end_time}${offset}`

            // Only add if not already in actual bookings
            const alreadyBooked = bookings.some(b => b.starttime === eventStart)
            
            if (!alreadyBooked) {
              events.push({
                id: `recurring-${recurring.recurringid}-${dateString}`,
                title: isOwn ? 'Your Recurring Booking' : 'Recurring Booking',
                start: eventStart,
                end: eventEnd,
                backgroundColor: isOwn ? '#7c3aed' : '#dc2626', // purple for own recurring, red for others
                borderColor: isOwn ? '#6d28d9' : '#b91c1c',
                extendedProps: {
                  userId: recurring.playerid,
                  confirmed: true,
                  isRecurring: true,
                  recurringid: recurring.recurringid
                }
              })
            }
          }
          
        current.setDate(current.getDate() + 1)
      }
    }

    successCallback(events)
  } catch (error) {
    console.error('Error generating events:', error)
    failureCallback(error)
  }
}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleDateSelect(selectInfo: any) {
    // Validate minimum 1-hour booking
    const duration = calculateDuration(selectInfo.startStr, selectInfo.endStr)
    if (duration < 1) {
      alert('Minimum booking duration is 1 hour')
      selectInfo.view.calendar.unselect()
      return
    }

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

  async function handlePayInPerson(makeRecurring: boolean) {
    if (pendingBooking) {
      if (makeRecurring) {
        alert('Recurring bookings require online payment')
        return
      }
      await createBooking(pendingBooking, 'in_person')
      setShowPaymentModal(false)
      setPendingBooking(null)
    }
  }

  async function handlePayOnline(makeRecurring: boolean) {
    if (!pendingBooking) return

    try {
      const duration = calculateDuration(pendingBooking.startStr, pendingBooking.endStr)
      
      // For recurring bookings, use the recurring endpoint
      if (makeRecurring && duration >= 1) {
        const totalPrice = (courtPrice || 0) * duration
        const response = await fetch('/api/recurring-booking/create-with-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            terenid: courtId,
            clubid: clubId,
            starttime: pendingBooking.startStr,
            endtime: pendingBooking.endStr,
            price: totalPrice
          })
        })

        if (!response.ok) {
          const error = await response.json()
          alert(error.error || 'Failed to create recurring booking')
          return
        }

        const { url } = await response.json()
        window.location.href = url // Redirect to Stripe
      } else {
        // Regular booking
        await createBooking(pendingBooking, 'online')
        setShowPaymentModal(false)
        setPendingBooking(null)
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      alert('Failed to create booking')
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

    // Recurring bookings must be cancelled from the dashboard
    if (event.extendedProps.isRecurring) {
      alert('To cancel recurring bookings, please go to your Player Dashboard')
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
      <style jsx global>{`
        /* Highlight available business hours */
        .fc-timegrid-col.fc-day {
          background-color: #f9fafb;
        }
        
        .fc-timegrid-col.fc-day.fc-day-today {
          background-color: #fef3c7;
        }
        
        /* Business hours highlighting */
        .fc .fc-non-business {
          background-color: #f3f4f6;
          opacity: 0.4;
        }
        
        .fc .fc-timegrid-col-bg .fc-non-business {
          background-color: #e5e7eb;
          opacity: 0.6;
        }
        
        /* Available time slots - light green tint */
        .fc .fc-timegrid-col:not(.fc-day-disabled) .fc-timegrid-col-frame {
          background: linear-gradient(to bottom, rgba(34, 197, 94, 0.02) 0%, rgba(34, 197, 94, 0.02) 100%);
        }
        
        /* Business hour cells - striped pattern for closed times */
        .fc-timegrid-col-bg > .fc-non-business {
          background: repeating-linear-gradient(
            45deg,
            #f3f4f6,
            #f3f4f6 10px,
            #e5e7eb 10px,
            #e5e7eb 20px
          );
        }
        
        /* Make selection more visible when dragging */
        .fc-highlight {
          background-color: rgba(34, 197, 94, 0.25) !important;
        }
      `}</style>
      
      <div className="mb-4">
        <div className="flex gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span>Your Confirmed Bookings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded"></div>
            <span>Your Pending Bookings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-600 rounded"></div>
            <span>Your Recurring Bookings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <span>Other Bookings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded" style={{ background: 'repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 3px, #e5e7eb 3px, #e5e7eb 6px)' }}></div>
            <span>Closed Hours</span>
          </div>
        </div>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        timeZone="local"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay'
        }}
        slotMinTime="06:00:00"
        slotMaxTime="24:00:00"
        slotDuration="00:30:00"
        slotLabelInterval="00:30"
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        allDaySlot={false}
        editable={false}
        selectable={true}
        selectMirror={true}
        selectConstraint="businessHours"
        businessHours={businessHours.length > 0 ? businessHours : undefined}
        dayMaxEvents={true}
        weekends={true}
        events={generateEvents}
        select={handleDateSelect}
        eventClick={handleEventClick}
        height="auto"
        contentHeight={600}
      />

      <div className="mt-4 text-sm text-gray-600 space-y-1">
        <p>• <strong>Available hours are highlighted</strong> - click and drag to book</p>
        <p>• Striped areas show when the club is closed</p>
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
          canBeRecurring={calculateDuration(pendingBooking.startStr, pendingBooking.endStr) >= 1}
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
