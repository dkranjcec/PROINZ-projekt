'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'

interface Notification {
  notiid: number
  notitext: string
  schedtime: string
  userid: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const deleteNotification = async (notiid: number) => {
    try {
      await fetch(`/api/notifications?notiid=${notiid}`, {
        method: 'DELETE'
      })
      fetchNotifications()
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
            </div>
            
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.notiid}
                    className="p-4 border-b border-gray-100 hover:bg-gray-50 flex justify-between items-start gap-2"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{notification.notitext}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.schedtime).toLocaleString(undefined, {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteNotification(notification.notiid)}
                      className="text-gray-400 hover:text-red-600 text-sm px-2"
                      title="Delete notification"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
