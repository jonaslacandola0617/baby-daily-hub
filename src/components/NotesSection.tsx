'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Plus, Trash2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import { Card, CardHeader, CardBody, Button, SectionLabel, Spinner } from '@/components/ui'
import { today } from '@/lib/utils'
import type { Note, Appointment, BabyProfile } from '@/types'

function formatNiceDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const isToday = dateStr === today()
  if (isToday) return 'Today'
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`
  if (dateStr === yStr) return 'Yesterday'
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${d}`
}

export default function NotesSection() {
  const qc = useQueryClient()
  const date = today()
  const [showHistory, setShowHistory] = useState(false)
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  // ── Today's note ──
  const { data: note, isLoading: notesLoading } = useQuery<Note>({
    queryKey: ['notes', date],
    queryFn: () => axios.get(`/api/notes?date=${date}`).then(r => r.data),
  })

  // ── All past notes ──
  const { data: allNotes = [], isLoading: historyLoading, refetch: refetchHistory } = useQuery<Note[]>({
    queryKey: ['notes-all'],
    queryFn: () => axios.get('/api/notes?all=true').then(r => r.data),
    enabled: showHistory,
  })

  const { data: appointments = [], isLoading: apptLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: () => axios.get('/api/appointments').then(r => r.data),
  })

  const { data: profile } = useQuery<BabyProfile>({
    queryKey: ['profile'],
    queryFn: () => axios.get('/api/profile').then(r => r.data),
  })

  const notesMutation = useMutation({
    mutationFn: (data: Partial<Note> & { date: string }) =>
      axios.put('/api/notes', data).then(r => r.data),
    onSuccess: (data) => {
      qc.setQueryData(['notes', date], data)
      // Invalidate history so it refreshes on next open
      qc.invalidateQueries({ queryKey: ['notes-all'] })
      toast.success('Saved!')
    },
    onError: () => toast.error('Failed to save'),
  })

  const profileMutation = useMutation({
    mutationFn: (data: Partial<BabyProfile>) => axios.put('/api/profile', data).then(r => r.data),
    onSuccess: (data) => { qc.setQueryData(['profile'], data); toast.success('Profile saved!') },
    onError: () => toast.error('Failed to save profile'),
  })

  const addApptMutation = useMutation({
    mutationFn: (data: { date: string; text: string; order: number }) =>
      axios.post('/api/appointments', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
    onError: () => toast.error('Failed to add appointment'),
  })

  const updateApptMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      axios.patch(`/api/appointments/${id}`, data).then(r => r.data),
    onSuccess: (updated: Appointment) => {
      qc.setQueryData(['appointments'], (old: Appointment[] = []) =>
        old.map(a => a.id === updated.id ? updated : a))
    },
  })

  const deleteApptMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/appointments/${id}`),
    onSuccess: (_, id) => {
      qc.setQueryData(['appointments'], (old: Appointment[] = []) => old.filter(a => a.id !== id))
      toast.success('Appointment removed')
    },
    onError: () => toast.error('Failed to delete'),
  })

  if (notesLoading || apptLoading) return <Spinner />

  // Past notes = all except today
  const pastNotes = allNotes.filter(n => n.date !== date)

  return (
    <div className="space-y-4">

      {/* ── Today's notes ── */}
      <Card>
        <CardHeader icon="📝" title="Today's Notes" />
        <CardBody className="space-y-4">
          <div>
            <SectionLabel>Observations & moments</SectionLabel>
            <div className="border-l-4 border-purple-300 pl-3">
              <AutosaveTextarea
                value={note?.dailyNotes ?? ''}
                placeholder="What happened today? Funny moments, behaviours, things to remember..."
                onCommit={v => notesMutation.mutate({ date, dailyNotes: v })}
                rows={4}
              />
            </div>
          </div>
          <div>
            <SectionLabel>Parent reminders</SectionLabel>
            <div className="border-l-4 border-teal-300 pl-3">
              <AutosaveTextarea
                value={note?.parentNotes ?? ''}
                placeholder="Upcoming appointments, questions for the doctor, things to buy..."
                onCommit={v => notesMutation.mutate({ date, parentNotes: v })}
                rows={3}
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 font-semibold">Auto-saves when you click away. One entry per day — come back anytime to edit.</p>
        </CardBody>
      </Card>

      {/* ── Notes history ── */}
      <Card>
        <CardHeader icon="📖" title="Past Notes">
          <button
            onClick={() => { setShowHistory(h => !h); if (!showHistory) refetchHistory() }}
            className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-brand-500 transition-colors"
          >
            <BookOpen size={13} />
            {showHistory ? 'Hide' : 'View history'}
            {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </CardHeader>

        {showHistory && (
          <CardBody className="p-0">
            {historyLoading && <div className="py-6 flex justify-center"><div className="w-6 h-6 border-4 border-orange-200 border-t-brand-500 rounded-full animate-spin" /></div>}

            {!historyLoading && pastNotes.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-2xl mb-2">📭</p>
                <p className="text-sm font-bold text-gray-400">No past notes yet</p>
                <p className="text-xs text-gray-300 mt-1">Your daily notes will appear here</p>
              </div>
            )}

            {!historyLoading && pastNotes.map(n => (
              <div key={n.date} className="border-b border-orange-50 last:border-0">
                <button
                  onClick={() => setExpandedDate(expandedDate === n.date ? null : n.date)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-orange-50/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-gray-700">{formatNiceDate(n.date)}</span>
                    <span className="text-[10px] font-bold text-gray-300">{n.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {n.dailyNotes && <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Notes</span>}
                    {n.parentNotes && <span className="text-[10px] font-bold bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full">Reminders</span>}
                    {expandedDate === n.date ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </button>

                {expandedDate === n.date && (
                  <div className="px-5 pb-4 space-y-3">
                    {n.dailyNotes && (
                      <div className="border-l-4 border-purple-200 pl-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400 mb-1">Observations</p>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">{n.dailyNotes}</p>
                      </div>
                    )}
                    {n.parentNotes && (
                      <div className="border-l-4 border-teal-200 pl-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-teal-400 mb-1">Reminders</p>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">{n.parentNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardBody>
        )}
      </Card>

      {/* ── Appointments ── */}
      <Card>
        <CardHeader icon="📅" title="Upcoming Appointments">
          <Button variant="ghost"
            onClick={() => addApptMutation.mutate({ date: '', text: '', order: appointments.length })}
            className="text-xs py-1.5 px-3">
            <Plus size={13} /> Add
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          {appointments.length === 0 && (
            <div className="px-5 py-6 text-center text-sm text-gray-400 font-semibold">
              No appointments yet — add one above
            </div>
          )}
          <div className="divide-y divide-orange-50">
            {appointments.map(appt => (
              <div key={appt.id} className="group flex items-center gap-3 px-5 py-3">
                <InlineInput
                  value={appt.date}
                  placeholder="Date"
                  onCommit={v => updateApptMutation.mutate({ id: appt.id, data: { date: v } })}
                  className="w-28 text-[11px] font-extrabold bg-orange-50 text-brand-600 rounded-lg px-2 py-1 border border-orange-100 outline-none"
                />
                <InlineInput
                  value={appt.text}
                  placeholder="Appointment details"
                  onCommit={v => updateApptMutation.mutate({ id: appt.id, data: { text: v } })}
                  className="flex-1 text-sm font-semibold text-gray-700 outline-none bg-transparent"
                />
                <button onClick={() => deleteApptMutation.mutate(appt.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* ── Baby Profile ── */}
      <Card>
        <CardHeader icon="⚙️" title="Baby Profile" />
        <CardBody>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <SectionLabel>Baby&apos;s name</SectionLabel>
              <InlineInput
                value={profile?.name ?? ''}
                placeholder="Enter name"
                onCommit={v => profileMutation.mutate({ name: v })}
                className="w-full px-3 py-2 rounded-xl border border-orange-100 bg-orange-50 font-nunito text-sm font-bold text-gray-800 outline-none focus:border-brand-400 transition-colors"
              />
            </div>
            <div>
              <SectionLabel>Date of birth</SectionLabel>
              <InlineInput
                value={profile?.birthdate ?? ''}
                placeholder="e.g. 2023-03-01"
                onCommit={v => profileMutation.mutate({ birthdate: v })}
                className="w-full px-3 py-2 rounded-xl border border-orange-100 bg-orange-50 font-nunito text-sm font-bold text-gray-800 outline-none focus:border-brand-400 transition-colors"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 font-semibold mt-3">
            All data is saved to your Vercel Postgres database automatically.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}

// ── Reusable sub-components ────────────────────────────────────────────────

function AutosaveTextarea({ value, onCommit, placeholder, rows = 3 }: {
  value: string; onCommit: (v: string) => void; placeholder?: string; rows?: number
}) {
  const [local, setLocal] = useState(value)
  useEffect(() => { setLocal(value) }, [value])
  const commit = useCallback(() => { if (local !== value) onCommit(local) }, [local, value, onCommit])
  return (
    <textarea
      value={local}
      placeholder={placeholder}
      rows={rows}
      onChange={e => setLocal(e.target.value)}
      onBlur={commit}
      className="w-full bg-transparent font-nunito text-sm font-semibold text-gray-700 outline-none resize-none placeholder:text-gray-300 leading-relaxed"
    />
  )
}

function InlineInput({ value, onCommit, placeholder, className }: {
  value: string; onCommit: (v: string) => void; placeholder?: string; className?: string
}) {
  const [local, setLocal] = useState(value)
  useEffect(() => { setLocal(value) }, [value])
  const commit = useCallback(() => { if (local !== value) onCommit(local) }, [local, value, onCommit])
  return (
    <input
      value={local}
      placeholder={placeholder}
      onChange={e => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => e.key === 'Enter' && commit()}
      className={className}
    />
  )
}
