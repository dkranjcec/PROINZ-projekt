import {
  checkBookingOverlap,
  hasAnyOverlap,
  validateBookingFields
} from '../booking-utils'

describe('Booking Business Logic', () => {
  describe('Test 6: Rubni uvjet - Detect overlapping bookings', () => {
    it('should detect when bookings overlap in various scenarios', () => {
      const existing = {
        starttime: '2026-01-15T10:00:00Z',
        endtime: '2026-01-15T11:00:00Z'
      }

      const overlapStart = { starttime: '2026-01-15T10:30:00Z', endtime: '2026-01-15T11:30:00Z' }
      const overlapEnd = { starttime: '2026-01-15T09:30:00Z', endtime: '2026-01-15T10:30:00Z' }
      const overlapContains = { starttime: '2026-01-15T09:00:00Z', endtime: '2026-01-15T12:00:00Z' }
      const noOverlap = { starttime: '2026-01-15T11:00:00Z', endtime: '2026-01-15T12:00:00Z' }

      expect(checkBookingOverlap(existing, overlapStart)).toBe(true)
      expect(checkBookingOverlap(existing, overlapEnd)).toBe(true)
      expect(checkBookingOverlap(existing, overlapContains)).toBe(true)
      expect(checkBookingOverlap(existing, noOverlap)).toBe(false)
    })
  })

  describe('Test 7: Rubni uvjet - Check multiple bookings', () => {
    it('should detect conflicts with multiple existing bookings', () => {
      const existingBookings = [
        { starttime: '2026-01-15T09:00:00Z', endtime: '2026-01-15T10:00:00Z' },
        { starttime: '2026-01-15T10:00:00Z', endtime: '2026-01-15T11:00:00Z' },
        { starttime: '2026-01-15T14:00:00Z', endtime: '2026-01-15T15:00:00Z' }
      ]

      const conflict = { starttime: '2026-01-15T10:30:00Z', endtime: '2026-01-15T11:30:00Z' }
      const noConflict = { starttime: '2026-01-15T12:00:00Z', endtime: '2026-01-15T13:00:00Z' }

      expect(hasAnyOverlap(existingBookings, conflict)).toBe(true)
      expect(hasAnyOverlap(existingBookings, noConflict)).toBe(false)
    })
  })

  describe('Test 8: Nepostojeće funkcionalnosti - Missing required fields', () => {
    it('should validate all required booking fields', () => {
      const valid = { terenid: 'court_1', clubid: 'club_123', starttime: '2026-01-15T10:00:00Z', endtime: '2026-01-15T11:00:00Z' }
      const missingTerenid = { clubid: 'club_123', starttime: '2026-01-15T10:00:00Z', endtime: '2026-01-15T11:00:00Z' }
      const missingClubid = { terenid: 'court_1', starttime: '2026-01-15T10:00:00Z', endtime: '2026-01-15T11:00:00Z' }

      expect(validateBookingFields(valid).valid).toBe(true)
      expect(validateBookingFields(missingTerenid).valid).toBe(false)
      expect(validateBookingFields(missingClubid).valid).toBe(false)
      expect(validateBookingFields(missingTerenid).error).toBe('Missing terenid')
    })
  })
})
