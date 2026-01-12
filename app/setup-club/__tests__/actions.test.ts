import { saveClubInfo } from '../actions'
import sql from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

jest.mock('@/lib/db', () => {
  const mockSql = jest.fn()
  return { __esModule: true, default: mockSql }
})

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn()
}))

describe('saveClubInfo - Club Registration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Test 3: Redovni slučaj - Save valid club data', () => {
    it('should successfully save club information to database', async () => {
      const mockUserId = 'user_123'

      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
      ;(sql as unknown as jest.Mock)
        .mockResolvedValueOnce([{ userid: mockUserId, role: 'club' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ userid: mockUserId, clubname: 'Test Club' }])

      await expect(
        saveClubInfo(mockUserId, 'Test Club', 'Zagreb, Street 123', 'Club rules', 45.8150, 15.9819)
      ).resolves.not.toThrow()

      expect(sql).toHaveBeenCalledTimes(3)
    })
  })

  describe('Test 4: Izazivanje pogreške - Duplicate club', () => {
    it('should throw error when club already exists', async () => {
      const mockUserId = 'user_123'

      ;(auth as jest.Mock).mockResolvedValue({ userId: mockUserId })
      ;(sql as unknown as jest.Mock)
        .mockResolvedValueOnce([{ userid: mockUserId, role: 'club' }])
        .mockResolvedValueOnce([{ userid: mockUserId, clubname: 'Existing Club' }])

      await expect(
        saveClubInfo(mockUserId, 'New Club', 'Address', 'Rules')
      ).rejects.toThrow('Club information already exists')
    })
  })
})
