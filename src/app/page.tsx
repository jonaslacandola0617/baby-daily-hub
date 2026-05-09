'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import RoutineSection    from '@/components/RoutineSection'
import TrackerSection    from '@/components/TrackerSection'
import MealsSection      from '@/components/MealsSection'
import MilestonesSection from '@/components/MilestonesSection'
import NotesSection      from '@/components/NotesSection'
import ToysSection       from '@/components/ToysSection'
import type { BabyProfile } from '@/types'

const TABS = [
  { id: 'routine',    label: 'Routine',  icon: '📅' },
  { id: 'tracker',    label: 'Tracker',  icon: '📊' },
  { id: 'meals',      label: 'Meals',    icon: '🍽️' },
  { id: 'toys',       label: 'Toys',     icon: '🧸' },
  { id: 'milestones', label: 'Growth',   icon: '⭐' },
  { id: 'notes',      label: 'Notes',    icon: '📝' },
]

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('routine')

  const { data: profile } = useQuery<BabyProfile>({
    queryKey: ['profile'],
    queryFn:  () => axios.get('/api/profile').then(r => r.data),
  })

  const babyName = profile?.name && profile.name !== 'Your Little One' ? profile.name : null

  return (
    <div className="min-h-screen bg-[#FFF9F5] flex flex-col">

      {/* ── Desktop header ── */}
      <header className="bg-white border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 flex items-center h-14 gap-3">
          <span className="text-xl select-none">🧸</span>
          <span className="font-fredoka text-lg text-brand-500 flex-1 truncate">
            {babyName ? `${babyName}'s Hub` : "Baby's Daily Hub"}
          </span>

          {/* Desktop nav */}
          <nav className="hidden sm:flex gap-0.5">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id ? 'bg-brand-50 text-brand-500' : 'text-gray-400 hover:text-gray-600'
                }`}>
                <span>{tab.icon}</span>
                <span className="hidden lg:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-3 sm:px-4 py-4 pb-28 sm:pb-8">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}>
            {activeTab === 'routine'    && <RoutineSection />}
            {activeTab === 'tracker'    && <TrackerSection />}
            {activeTab === 'meals'      && <MealsSection />}
            {activeTab === 'toys'       && <ToysSection />}
            {activeTab === 'milestones' && <MilestonesSection />}
            {activeTab === 'notes'      && <NotesSection />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-orange-100 safe-area-bottom">
        <div className="flex items-stretch h-16">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 relative ${
                activeTab === tab.id ? 'text-brand-500' : 'text-gray-400'
              }`}>
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className={`text-[9px] font-bold ${activeTab === tab.id ? 'text-brand-500' : 'text-gray-400'}`}>
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-brand-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
