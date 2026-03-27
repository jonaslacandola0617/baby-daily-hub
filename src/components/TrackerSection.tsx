'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardBody, Input, SectionLabel, Spinner } from '@/components/ui'
import { today } from '@/lib/utils'
import type { DailyTracker } from '@/types'

const MOODS = ['😊', '😐', '😢', '😤', '🤒']
const MAX_WATER = 8
const MAX_DIAPER = 12

export default function TrackerSection() {
  const qc = useQueryClient()
  const date = today()

  const { data: tracker, isLoading } = useQuery<DailyTracker>({
    queryKey: ['tracker', date],
    queryFn: () => axios.get(`/api/tracker?date=${date}`).then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: (data: Partial<DailyTracker> & { date: string }) => axios.put('/api/tracker', data).then(r => r.data),
    onSuccess: (data) => {
      qc.setQueryData(['tracker', date], data)
      toast.success('Saved!')
    },
    onError: () => toast.error('Failed to save'),
  })

  function update(field: keyof DailyTracker, value: unknown) {
    mutation.mutate({ date, [field]: value })
  }

  if (isLoading) return <Spinner />
  if (!tracker) return null

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Night sleep', value: `${tracker.sleepHours}h`, color: 'bg-blue-50 text-blue-700' },
          { label: 'Nap today', value: `${tracker.napHours}h`, color: 'bg-purple-50 text-purple-700' },
          { label: 'Water cups', value: tracker.waterCups, color: 'bg-cyan-50 text-cyan-700' },
          { label: 'Diaper changes', value: tracker.diaperCount, color: 'bg-orange-50 text-orange-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl px-4 py-3 text-center border border-orange-100 ${s.color}`}>
            <p className="font-fredoka text-2xl">{s.value}</p>
            <p className="text-[11px] font-bold mt-0.5 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Sleep */}
        <Card>
          <CardHeader icon="🌙" title="Sleep tracker" />
          <CardBody className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <SectionLabel>Night sleep (target 11–14h)</SectionLabel>
                <span className="text-sm font-extrabold text-brand-500">{tracker.sleepHours}h</span>
              </div>
              <input type="range" min={6} max={14} step={0.5} value={tracker.sleepHours}
                onChange={e => update('sleepHours', parseFloat(e.target.value))}
                className="w-full" />
              <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-0.5">
                <span>6h</span><span>10h</span><span>14h</span>
              </div>
              <div className="mt-2 h-5 bg-blue-50 rounded-full overflow-hidden">
                <div className="h-full bg-blue-300 rounded-full transition-all duration-300 flex items-center justify-center"
                  style={{ width: `${Math.min(100, ((tracker.sleepHours - 6) / 8) * 100)}%` }}>
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <SectionLabel>Nap (target 1–3h)</SectionLabel>
                <span className="text-sm font-extrabold text-purple-500">{tracker.napHours}h</span>
              </div>
              <input type="range" min={0} max={3} step={0.5} value={tracker.napHours}
                onChange={e => update('napHours', parseFloat(e.target.value))}
                className="w-full" />
              <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-0.5">
                <span>0h</span><span>1.5h</span><span>3h</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Water & Diaper */}
        <Card>
          <CardHeader icon="💧" title="Water & diapers" />
          <CardBody className="space-y-4">
            <div>
              <SectionLabel>Water cups today (tap to log)</SectionLabel>
              <div className="flex flex-wrap gap-2 mt-1">
                {Array.from({ length: MAX_WATER }, (_, i) => (
                  <button key={i} onClick={() => update('waterCups', tracker.waterCups === i + 1 ? i : i + 1)}
                    className={`w-9 h-9 rounded-full border-2 text-base transition-all active:scale-95 ${i < tracker.waterCups ? 'bg-blue-100 border-blue-300 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-300'}`}>
                    {i < tracker.waterCups ? '💧' : '·'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <SectionLabel>Diaper changes (tap to log)</SectionLabel>
              <div className="flex flex-wrap gap-2 mt-1">
                {Array.from({ length: MAX_DIAPER }, (_, i) => (
                  <button key={i} onClick={() => update('diaperCount', tracker.diaperCount === i + 1 ? i : i + 1)}
                    className={`w-9 h-9 rounded-full border-2 text-base transition-all active:scale-95 ${i < tracker.diaperCount ? 'bg-purple-100 border-purple-300 text-purple-600' : 'bg-gray-50 border-gray-200 text-gray-300'}`}>
                    {i < tracker.diaperCount ? '🩲' : '·'}
                  </button>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Health log */}
      <Card>
        <CardHeader icon="🌡️" title="Health log" />
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <SectionLabel>Temperature</SectionLabel>
              <DebounceInput
                placeholder="e.g. 36.5°C"
                value={tracker.temperature ?? ''}
                onCommit={v => update('temperature', v)}
              />
            </div>
            <div>
              <SectionLabel>Weight</SectionLabel>
              <DebounceInput
                placeholder="e.g. 12.5 kg"
                value={tracker.weight ?? ''}
                onCommit={v => update('weight', v)}
              />
            </div>
            <div>
              <SectionLabel>Medicine given</SectionLabel>
              <DebounceInput
                placeholder="Name + dose + time"
                value={tracker.medicine ?? ''}
                onCommit={v => update('medicine', v)}
              />
            </div>
            <div>
              <SectionLabel>Mood today</SectionLabel>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                {MOODS.map(m => (
                  <button key={m} onClick={() => update('mood', tracker.mood === m ? null : m)}
                    className={`text-xl w-9 h-9 rounded-full border-2 transition-all active:scale-95 ${tracker.mood === m ? 'bg-orange-100 border-brand-400 scale-110' : 'bg-gray-50 border-gray-200'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

function DebounceInput({ value, onCommit, placeholder }: { value: string; onCommit: (v: string) => void; placeholder?: string }) {
  const [local, setLocal] = useState(value)
  useEffect(() => { setLocal(value) }, [value])
  const commit = useCallback(() => { if (local !== value) onCommit(local) }, [local, value, onCommit])
  return (
    <Input
      value={local}
      placeholder={placeholder}
      onChange={e => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => e.key === 'Enter' && commit()}
    />
  )
}
