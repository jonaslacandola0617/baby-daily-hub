'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import RoutineSection from '@/components/RoutineSection'
import TrackerSection from '@/components/TrackerSection'
import MealsSection from '@/components/MealsSection'
import MilestonesSection from '@/components/MilestonesSection'
import NotesSection from '@/components/NotesSection'
import type { BabyProfile } from '@/types'

const TABS = [
  { id: 'routine',    label: 'Routine',   icon: '📅' },
  { id: 'tracker',    label: 'Tracker',   icon: '📊' },
  { id: 'meals',      label: 'Meals',     icon: '🍽️' },
  { id: 'milestones', label: 'Growth',    icon: '⭐' },
  { id: 'notes',      label: 'Notes',     icon: '📝' },
]

const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const months = ['January','February','March','April','May','June','July','August','September','October','November','December']

function todayStr() {
  const d = new Date()
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('routine')

  const { data: profile } = useQuery<BabyProfile>({
    queryKey: ['profile'],
    queryFn: () => axios.get('/api/profile').then(r => r.data),
  })

  return (
    <div className="min-h-screen bg-[#FFF9F5]">
      {/* Header */}
      <header className="bg-white border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <span className="text-2xl">🧸</span>
          <div className="flex-1 min-w-0">
            <h1 className="font-fredoka text-lg text-brand-500 leading-none truncate">
              {profile?.name ? `${profile.name}'s Hub` : "Baby's Daily Hub"}
            </h1>
            <p className="text-[11px] font-bold text-gray-400 leading-none mt-0.5">{todayStr()}</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-3xl mx-auto px-4 pb-0">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-0">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'text-brand-500 border-brand-500'
                    : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-5 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'routine'    && <RoutineSection />}
            {activeTab === 'tracker'    && <TrackerSection />}
            {activeTab === 'meals'      && <MealsSection />}
            {activeTab === 'milestones' && <MilestonesSection />}
            {activeTab === 'notes'      && <NotesSection />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
