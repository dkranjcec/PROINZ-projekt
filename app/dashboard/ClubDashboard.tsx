import sql from '@/lib/db'
import Link from 'next/link'
import { getPhotos, getContent, getLessons, getSubscriptions, getPriceList } from '../club-management/actions'

interface ClubDashboardProps {
  userId: string
  club: {
    clubname: string
    clubaddress: string
    workhourstart: string
    workhourend: string
    rules: string
  }
}

export default async function ClubDashboard({ userId, club }: ClubDashboardProps) {
  // Fetch all related data
  const [photos, content, lessons, subscriptions, priceList] = await Promise.all([
    getPhotos(userId).catch(() => []),
    getContent(userId).catch(() => null),
    getLessons(userId).catch(() => []),
    getSubscriptions(userId).catch(() => []),
    getPriceList(userId).catch(() => []),
  ])

  const formatTime = (time: string) => {
    if (!time) return 'N/A'
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">{club.clubname}</h1>
        <p className="text-green-100 text-lg mb-4">📍 {club.clubaddress}</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="bg-white/20 px-3 py-1 rounded-full">
            🕐 {formatTime(club.workhourstart)} - {formatTime(club.workhourend)}
          </span>
          <span className="bg-white/20 px-3 py-1 rounded-full">
            📷 {Array.isArray(photos) ? photos.length : 0} Photos
          </span>
          <span className="bg-white/20 px-3 py-1 rounded-full">
            🎓 {Array.isArray(lessons) ? lessons.length : 0} Lessons
          </span>
          <span className="bg-white/20 px-3 py-1 rounded-full">
            💳 {Array.isArray(subscriptions) ? subscriptions.length : 0} Subscriptions
          </span>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon="📷"
          label="Photos"
          value={Array.isArray(photos) ? photos.length : 0}
          link="/club-management"
          linkText="Manage"
        />
        <StatCard
          icon="🎓"
          label="Lessons"
          value={Array.isArray(lessons) ? lessons.length : 0}
          link="/club-management"
          linkText="Manage"
        />
        <StatCard
          icon="💳"
          label="Subscriptions"
          value={Array.isArray(subscriptions) ? subscriptions.length : 0}
          link="/club-management"
          linkText="Manage"
        />
        <StatCard
          icon="💰"
          label="Price Items"
          value={Array.isArray(priceList) ? priceList.length : 0}
          link="/club-management"
          linkText="Manage"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Photos Preview */}
        <SectionCard
          title="Photos"
          icon="📷"
          action={<Link href="/club-management" className="text-green-600 hover:text-green-700 font-medium">View All</Link>}
        >
          {Array.isArray(photos) && photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {(photos as any[]).slice(0, 6).map((photo: any, index: number) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={photo.photolink}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3C/svg%3E'
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No photos yet. <Link href="/club-management" className="text-green-600 hover:underline">Add some photos</Link></p>
          )}
        </SectionCard>

        {/* Content Preview */}
        <SectionCard
          title="Content"
          icon="📝"
          action={<Link href="/club-management" className="text-green-600 hover:text-green-700 font-medium">Edit</Link>}
        >
          {content && (content as { contenttext: string }).contenttext ? (
            <div className="text-gray-700 text-sm line-clamp-4">
              {(content as { contenttext: string }).contenttext}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No content yet. <Link href="/club-management" className="text-green-600 hover:underline">Add content</Link></p>
          )}
        </SectionCard>

        {/* Lessons Preview */}
        <SectionCard
          title="Lessons"
          icon="🎓"
          action={<Link href="/club-management" className="text-green-600 hover:text-green-700 font-medium">View All</Link>}
        >
          {Array.isArray(lessons) && lessons.length > 0 ? (
            <div className="space-y-3">
              {(lessons as any[]).slice(0, 3).map((lesson: any) => (
                <div key={lesson.lessonid} className="border-l-4 border-green-500 pl-3">
                  <p className="text-sm text-gray-700 line-clamp-2">{lesson.lessoninfo}</p>
                  <p className="text-sm font-semibold text-green-600 mt-1">${lesson.price.toFixed(2)}</p>
                </div>
              ))}
              {(lessons as any[]).length > 3 && (
                <p className="text-xs text-gray-500">+{(lessons as any[]).length - 3} more lessons</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No lessons yet. <Link href="/club-management" className="text-green-600 hover:underline">Add lessons</Link></p>
          )}
        </SectionCard>

        {/* Subscriptions Preview */}
        <SectionCard
          title="Subscriptions"
          icon="💳"
          action={<Link href="/club-management" className="text-green-600 hover:text-green-700 font-medium">View All</Link>}
        >
          {Array.isArray(subscriptions) && subscriptions.length > 0 ? (
            <div className="space-y-3">
              {(subscriptions as any[]).slice(0, 3).map((sub: any) => (
                <div key={sub.subid} className="border-l-4 border-blue-500 pl-3">
                  <p className="text-sm text-gray-700 line-clamp-2">{sub.subinfo}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">{sub.duration} days</span>
                    <span className="text-sm font-semibold text-blue-600">${sub.price.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {(subscriptions as any[]).length > 3 && (
                <p className="text-xs text-gray-500">+{(subscriptions as any[]).length - 3} more subscriptions</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No subscriptions yet. <Link href="/club-management" className="text-green-600 hover:underline">Add subscriptions</Link></p>
          )}
        </SectionCard>
      </div>

      {/* Price List & Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price List */}
        <SectionCard
          title="Price List"
          icon="💰"
          action={<Link href="/club-management" className="text-green-600 hover:text-green-700 font-medium">View All</Link>}
        >
          {Array.isArray(priceList) && priceList.length > 0 ? (
            <div className="space-y-2">
              {(priceList as any[]).slice(0, 5).map((item: any) => (
                <div key={item.productid} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{item.productname}</span>
                  <span className="text-sm font-semibold text-gray-900">${item.price.toFixed(2)}</span>
                </div>
              ))}
              {(priceList as any[]).length > 5 && (
                <p className="text-xs text-gray-500 mt-2">+{(priceList as any[]).length - 5} more items</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No price list items yet. <Link href="/club-management" className="text-green-600 hover:underline">Add items</Link></p>
          )}
        </SectionCard>

        {/* Rules */}
        <SectionCard
          title="Club Rules"
          icon="📋"
          action={<Link href="/club-management" className="text-green-600 hover:text-green-700 font-medium">Edit</Link>}
        >
          <div className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-6">
            {club.rules || 'No rules set yet.'}
          </div>
        </SectionCard>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/club-management"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <span className="text-2xl mb-2">📷</span>
            <span className="text-sm font-medium">Manage Photos</span>
          </Link>
          <Link
            href="/club-management"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <span className="text-2xl mb-2">📝</span>
            <span className="text-sm font-medium">Edit Content</span>
          </Link>
          <Link
            href="/club-management"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <span className="text-2xl mb-2">🎓</span>
            <span className="text-sm font-medium">Manage Lessons</span>
          </Link>
          <Link
            href="/club-management"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <span className="text-2xl mb-2">⚙️</span>
            <span className="text-sm font-medium">Full Management</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, link, linkText }: { icon: string; label: string; value: number; link: string; linkText: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl mb-1">{icon}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600">{label}</p>
        </div>
        <Link href={link} className="text-green-600 hover:text-green-700 text-sm font-medium">
          {linkText} →
        </Link>
      </div>
    </div>
  )
}

function SectionCard({ title, icon, action, children }: { title: string; icon: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </h3>
        {action}
      </div>
      <div>{children}</div>
    </div>
  )
}

