import { savePlayerInfo } from '../actions'
import { auth } from '@clerk/nextjs/server'

jest.mock('@/lib/db', () => {
  const mockSql = jest.fn()
  return { __esModule: true, default: mockSql }
})

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn()
}))

describe('savePlayerInfo - Player Authorization', () => {
  describe('Test 5: Izazivanje pogreške - Unauthorized user', () => {
    it('should throw error when user tries to edit another user profile', async () => {
      ;(auth as jest.Mock).mockResolvedValue({ userId: 'user_999' })

      await expect(
        savePlayerInfo('user_456', 'Ivan', 'Horvat', '+385 91 123 4567')
      ).rejects.toThrow('Unauthorized')
    })
  })
})
