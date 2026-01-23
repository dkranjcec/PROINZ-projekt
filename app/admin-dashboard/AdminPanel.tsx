'use client'
// AI korišten za pomoć pri stvaranju admin dashboarda
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Club {
  userid: string
  clubname: string
  clubaddress: string
}

interface Player {
  userid: string
  firstname: string
  lastname: string
  phone_number: string
}

interface Court {
  terenid: number
  terenname: string
  userid: string
  clubname: string
  type: string
  size: string
  ground: string
  price: number | null
}

interface Booking {
  terenid: number
  playerid: string
  clubid: string
  terenname: string
  clubname: string
  playername: string
  starttime: string
  endtime: string
  confirmed: boolean
  stripesessionid: string | null
}

type ViewMode = 'clubs' | 'players' | 'courts' | 'bookings'

export default function AdminPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>('clubs')
  const [clubs, setClubs] = useState<Club[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<string>('name')

  useEffect(() => {
    loadData()
    setSearchTerm('') // Clear search when switching tabs
    
    // Set appropriate default sort for each tab
    switch (viewMode) {
      case 'clubs':
      case 'players':
      case 'courts':
        setSortBy('name')
        break
      case 'bookings':
        setSortBy('date')
        break
    }
  }, [viewMode])

  async function loadData() {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/${viewMode}`)
      if (response.ok) {
        const data = await response.json()
        
        switch (viewMode) {
          case 'clubs':
            setClubs(data)
            break
          case 'players':
            setPlayers(data)
            break
          case 'courts':
            setCourts(data)
            break
          case 'bookings':
            setBookings(data)
            break
        }
      } else {
        alert('Failed to load data')
      }
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(type: ViewMode, id: string | number) {
    if (!confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) {
      return
    }

    try {
      let url = `/api/admin/${type}/${id}`
      
      // For bookings, we need to pass composite key as query params
      if (type === 'bookings' && typeof id === 'object') {
        const booking = id as any
        url = `/api/admin/bookings?playerid=${booking.playerid}&terenid=${booking.terenid}&clubid=${booking.clubid}&starttime=${encodeURIComponent(booking.starttime)}`
      }

      const response = await fetch(url, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Deleted successfully')
        loadData()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Error deleting item')
    }
  }

  // Filter and sort data based on search and sort options
  const getFilteredAndSortedData = () => {
    let filtered: any[] = []
    
    switch (viewMode) {
      case 'clubs':
        filtered = clubs.filter(club => 
          club.clubname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          club.clubaddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
          club.userid.toLowerCase().includes(searchTerm.toLowerCase())
        )
        if (sortBy === 'name') filtered.sort((a, b) => a.clubname.localeCompare(b.clubname))
        break
        
      case 'players':
        filtered = players.filter(player =>
          `${player.firstname || ''} ${player.lastname || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (player.phone_number || '').includes(searchTerm) ||
          (player.userid || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
        if (sortBy === 'name') {
          filtered.sort((a, b) => {
            const lastNameA = a.lastname || ''
            const lastNameB = b.lastname || ''
            return lastNameA.localeCompare(lastNameB)
          })
        }
        break
        
      case 'courts':
        filtered = courts.filter(court =>
          court.terenname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          court.clubname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          court.type.toLowerCase().includes(searchTerm.toLowerCase())
        )
        if (sortBy === 'name') filtered.sort((a, b) => a.terenname.localeCompare(b.terenname))
        if (sortBy === 'club') filtered.sort((a, b) => a.clubname.localeCompare(b.clubname))
        break
        
      case 'bookings':
        filtered = bookings.filter(booking =>
          booking.clubname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.terenname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.playername.toLowerCase().includes(searchTerm.toLowerCase())
        )
        if (sortBy === 'date') filtered.sort((a, b) => new Date(b.starttime).getTime() - new Date(a.starttime).getTime())
        if (sortBy === 'club') filtered.sort((a, b) => a.clubname.localeCompare(b.clubname))
        break
    }
    
    return filtered
  }

  const filteredData = getFilteredAndSortedData()

  return (
    <div>
      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setViewMode('clubs')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            viewMode === 'clubs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Clubs
        </button>
        <button
          onClick={() => setViewMode('players')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            viewMode === 'players'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Players
        </button>
        <button
          onClick={() => setViewMode('courts')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            viewMode === 'courts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Courts
        </button>
        <button
          onClick={() => setViewMode('bookings')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            viewMode === 'bookings'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Bookings
        </button>
      </div>

      {/* Search and Sort Controls */}
      <div className="mb-4 flex gap-4 items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder={
              viewMode === 'players' 
                ? 'Search by name, phone, or user ID...'
                : `Search ${viewMode}...`
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {viewMode === 'bookings' && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort:</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Newest First)</SelectItem>
                <SelectItem value="club">Club Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="text-sm text-gray-600">
          {filteredData.length} {viewMode}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {viewMode === 'clubs' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Club Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(filteredData as Club[]).map((club) => (
                    <tr key={`club-${club.userid}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{club.userid.substring(0, 12)}...</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a 
                          href={`/club/${club.userid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {club.clubname}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{club.clubaddress}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          onClick={() => handleDelete('clubs', club.userid)}
                          variant="destructive"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredData.length === 0 && (
                <p className="text-center py-8 text-gray-500">No clubs found</p>
              )}
            </div>
          )}

          {viewMode === 'players' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(filteredData as Player[]).map((player) => (
                    <tr key={`player-${player.userid}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{player.userid.substring(0, 12)}...</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.firstname} {player.lastname}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.phone_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          onClick={() => handleDelete('players', player.userid)}
                          variant="destructive"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredData.length === 0 && (
                <p className="text-center py-8 text-gray-500">No players found</p>
              )}
            </div>
          )}

          {viewMode === 'courts' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Court Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Club</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type/Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(filteredData as Court[]).map((court) => (
                    <tr key={`court-${court.terenid}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{court.terenid}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{court.terenname}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{court.clubname}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{court.type} / {court.size}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{court.price ? `€${court.price}` : 'Free'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          onClick={() => handleDelete('courts', court.terenid)}
                          variant="destructive"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredData.length === 0 && (
                <p className="text-center py-8 text-gray-500">No courts found</p>
              )}
            </div>
          )}

          {viewMode === 'bookings' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Court ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Court</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Club</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(filteredData as Booking[]).map((booking) => (
                    <tr key={`booking-${booking.playerid}-${booking.terenid}-${booking.starttime}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.terenid}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.terenname}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{booking.clubname}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.playername}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(booking.starttime).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          booking.confirmed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.confirmed ? 'Confirmed' : 'Pending'}
                        </span>
                        {booking.stripesessionid && (
                          <span className="ml-2 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Paid
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          onClick={() => handleDelete('bookings', booking as any)}
                          variant="destructive"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredData.length === 0 && (
                <p className="text-center py-8 text-gray-500">No bookings found</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
