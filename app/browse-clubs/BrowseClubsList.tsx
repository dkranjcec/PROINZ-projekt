'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface Club {
  userid: string
  clubname: string
  clubaddress: string
}

interface BrowseClubsListProps {
  clubs: Club[]
}

export default function BrowseClubsList({ clubs }: BrowseClubsListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredClubs = clubs.filter(club =>
    club.clubname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.clubaddress.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search clubs by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredClubs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-gray-500 text-center">
            {searchQuery ? 'No clubs match your search' : 'No clubs available yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredClubs.map((club) => (
              <div key={club.userid} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {club.clubname}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <span className="mr-1">📍</span>
                      {club.clubaddress}
                    </p>
                  </div>
                  <Link href={`/club/${club.userid}`}>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 whitespace-nowrap">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
