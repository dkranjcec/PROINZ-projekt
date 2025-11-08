'use client'

import { useState } from 'react'
import PhotosSection from './PhotosSection'
import ContentSection from './ContentSection'
import LessonsSection from './LessonsSection'
import SubscriptionsSection from './SubscriptionsSection'
import PriceListSection from './PriceListSection'

export default function ClubManagementTabs({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState<'photos' | 'content' | 'lessons' | 'subscriptions' | 'pricelist'>('photos')
  
  const tabs = [
    { id: 'photos' as const, label: 'Photos', icon: '📷' },
    { id: 'content' as const, label: 'Content', icon: '📝' },
    { id: 'lessons' as const, label: 'Lessons', icon: '🎓' },
    { id: 'subscriptions' as const, label: 'Subscriptions', icon: '💳' },
    { id: 'pricelist' as const, label: 'Price List', icon: '💰' },
  ]
  
  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="p-6">
        {activeTab === 'photos' && <PhotosSection userId={userId} />}
        {activeTab === 'content' && <ContentSection userId={userId} />}
        {activeTab === 'lessons' && <LessonsSection userId={userId} />}
        {activeTab === 'subscriptions' && <SubscriptionsSection userId={userId} />}
        {activeTab === 'pricelist' && <PriceListSection userId={userId} />}
      </div>
    </div>
  )
}

