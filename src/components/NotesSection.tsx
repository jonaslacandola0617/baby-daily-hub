'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardBody, Button, Input, SectionLabel, Spinner } from '@/components/ui'
import { today } from '@/lib/utils'
import type { Note, Appointment, BabyProfile } from '@/types'

export default function NotesSection() {
  const qc = useQueryClient()
  const date = today()

  const { data: note, isLoading: notesLoading } = useQuery<Note>({
    queryKey: ['notes', date],
    queryFn: () => axios.get(`/api/notes?date=${date}`).then(r => r.data),
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
    mutationFn: (data: Partial<Note> & { date: string }) => axios.put('/api/notes', data).then(r => r.data),
    onSuccess: (data) => { qc.setQueryData(['notes', date], data); toast.success('Notes saved!') },
    onError: () => toast.error('Failed to save notes'),
  })

  const profileMutation = useMutation({
    mutationFn: (data: Partial<BabyProfile>) => axios.put('/api/profile', data).then(r => r.data),
    onSuccess: (data) => { qc.setQueryData(['profile'], data); toast.success('Profile saved!') },
    onError: () => toast.error('Failed to save profile'),
  })

  const addApptMutation = useMutation({
    mutationFn: (data: { date: string; text: string; order: number }) => axios.post('/api/appointments', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
    onError: () => toast.error('Failed to add appointment'),
  })

  const updateApptMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) => axios.patch(`/api/appointments/${id}`, data).then(r => r.data),
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

  return (
    <div className="space-y-4">
      {/* Notes */}
      <Card>
        <CardHeader icon="📝" title="Daily Notes" />
        <CardBody className="space-y-4">
          <div>
            <SectionLabel>Today's observations</SectionLabel>
            <div className="border-l-4 border-purple-300 pl-3">
              <AutosaveTextarea
                value={note?.dailyNotes ?? ''}
                placeholder="Quick notes — behaviours, funny moments, things to remember..."
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
        </CardBody>
      </Card>

      {/* Appointments */}
      <Card>
        <CardHeader icon="📅" title="Upcoming Appointments">
          <Button variant="ghost" onClick={() => addApptMutation.mutate({ date: '', text: '', order: appointments.length })} className="text-xs py-1.5 px-3">
            <Plus size={13} /> Add
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          {appointments.length === 0 && (
            <div className="px-5 py-6 text-center text-sm text-gray-400 font-semibold">No appointments yet — add one above</div>
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

      {/* Profile settings */}
      <Card>
        <CardHeader icon="⚙️" title="Baby Profile" />
        <CardBody>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <SectionLabel>Baby's name</SectionLabel>
              <InlineInput
                value={profile?.name ?? ''}
                placeholder="Enter name"
                onCommit={v => profileMutation.mutate({ name: v })}
                className="w-full px-3 py-2 rounded-xl border border-orange-100 bg-orange-50 font-nunito text-sm font-bold text-gray-800 outline-none focus:border-brand-400 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <SectionLabel>Date of birth</SectionLabel>
              <InlineInput
                value={profile?.birthdate ?? ''}
                placeholder="e.g. 2023-03-01"
                onCommit={v => profileMutation.mutate({ birthdate: v })}
                className="w-full px-3 py-2 rounded-xl border border-orange-100 bg-orange-50 font-nunito text-sm font-bold text-gray-800 outline-none focus:border-brand-400 focus:bg-white transition-colors"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 font-semibold mt-3">All data is saved to your Vercel Postgres database automatically.</p>
        </CardBody>
      </Card>
    </div>
  )
}

function AutosaveTextarea({ value, onCommit, placeholder, rows = 3 }: { value: string; onCommit: (v: string) => void; placeholder?: string; rows?: number }) {
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

function InlineInput({ value, onCommit, placeholder, className }: { value: string; onCommit: (v: string) => void; placeholder?: string; className?: string }) {
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
