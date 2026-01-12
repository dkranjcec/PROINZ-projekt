import { filterClubs, type Club } from '@/lib/club-utils'

const mockClubs: Club[] = [
  { userid: '1', clubname: 'Tennis Paradise', clubaddress: 'Zagreb, Maksimirska 123' },
  { userid: '2', clubname: 'Padel Club Split', clubaddress: 'Split, Zrinsko-Frankopanska 45' },
  { userid: '3', clubname: 'Grand Tennis Center', clubaddress: 'Rijeka, Korzo 10' }
]

describe('BrowseClubsList - Filter Logic', () => {
  describe('Test 1: Redovni slučaj - Filter clubs by search query', () => {
    it('should filter clubs by name or address', () => {
      const resultByName = filterClubs(mockClubs, 'Tennis')
      expect(resultByName).toHaveLength(2)
      expect(resultByName[0].clubname).toBe('Tennis Paradise')

      const resultByAddress = filterClubs(mockClubs, 'Zagreb')
      expect(resultByAddress).toHaveLength(1)
      expect(resultByAddress[0].clubaddress).toContain('Zagreb')
    })
  })

  describe('Test 2: Rubni uvjet - Malicious input patterns', () => {
    it('should handle SQL injection and XSS attempts safely', () => {
      const dangerousInputs = [
        "'; DROP TABLE club; --",
        "<script>alert('xss')</script>",
        "' OR '1'='1"
      ]

      dangerousInputs.forEach(input => {
        expect(() => {
          const result = filterClubs(mockClubs, input)
          expect(Array.isArray(result)).toBe(true)
        }).not.toThrow()
      })
    })
  })
})
