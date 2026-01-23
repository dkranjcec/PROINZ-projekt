'use client'

import { SignInButton, SignedIn, SignedOut, useUser, useClerk } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import NotificationBell from './NotificationBell'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

export default function Header() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getInitials = () => {
    if (!user) return '?'
    const firstName = user.firstName || ''
    const lastName = user.lastName || ''
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase() || '?'
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center max-w-7xl">
        <Link href={isLoaded && user ? '/dashboard' : '/'} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              PadelTime
            </h1>
            <p className="text-xs text-gray-500 -mt-1">Rješenje tima {':3'}</p>
          </div>
        </Link>
        
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>
          
          <SignedIn>
            <NotificationBell />
            
            {/* Custom User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold flex items-center justify-center hover:shadow-lg transition-all hover:scale-105"
              >
                {getInitials()}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.emailAddresses[0]?.emailAddress}
                    </p>
                  </div>
                  
                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/browse-clubs"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Browse Clubs
                    </Link>
                  </div>
                  
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SignedIn>
        </div>
      </nav>
    </header>
  )
}
