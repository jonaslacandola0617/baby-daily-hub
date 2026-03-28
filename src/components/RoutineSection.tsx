'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { Card, CardHeader, CardBody, Button, Input, Badge, SectionLabel, Spinner } from '@/components/ui'
import type { RoutineItem, Category, BabyProfile } from '@/types'

const CATEGORIES: Category[] = ['sleep', 'meal', 'play', 'care', 'learn', 'outdoor']
const emptyForm = { timeStart: '', timeEnd: '', activity: '', note: '', category: 'play' as Category }

const DOT_COLORS: Record<string, string> = {
  sleep: 'bg-blue-400', meal: 'bg-green-500', play: 'bg-amber-400',
  care: 'bg-purple-400', learn: 'bg-teal-400', outdoor: 'bg-orange-400',
}

const CHECKLIST_ITEMS_KEY = 'babyhub_checklistItems'
const CHECKLIST_CHECKS_KEY = 'babyhub_checks'
const DEFAULT_CHECKLIST = [
  'Diaper / toilet check', 'Breakfast eaten', 'Teeth brushed',
  'Vitamins / supplements', 'Sunscreen applied', 'Change of clothes packed',
  'Nap bag packed (if going out)', 'Comfort toy ready for nap',
]

function calcAge(birthdate: string | null | undefined): string {
  if (!birthdate) return ''
  const dob = new Date(birthdate)
  if (isNaN(dob.getTime())) return ''
  const now = new Date()
  let years  = now.getFullYear() - dob.getFullYear()
  let months = now.getMonth()    - dob.getMonth()
  if (now.getDate() < dob.getDate()) months--
  if (months < 0) { years--; months += 12 }
  if (years < 0) return 'Newborn'
  if (years === 0) return months <= 1 ? `${months} month old` : `${months} months old`
  if (years >= 1 && months > 0) return `${years}y ${months}m old`
  return `${years} year${years !== 1 ? 's' : ''} old`
}

function formatFullDate(d: Date) {
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
}

function loadChecklistItems(): string[] {
  if (typeof window === 'undefined') return DEFAULT_CHECKLIST
  try { const s = localStorage.getItem(CHECKLIST_ITEMS_KEY); return s ? JSON.parse(s) : DEFAULT_CHECKLIST } catch { return DEFAULT_CHECKLIST }
}
function saveChecklistItems(items: string[]) { localStorage.setItem(CHECKLIST_ITEMS_KEY, JSON.stringify(items)) }
function loadChecks(): Record<number, boolean> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(CHECKLIST_CHECKS_KEY) || '{}') } catch { return {} }
}
function saveChecks(c: Record<number, boolean>) { localStorage.setItem(CHECKLIST_CHECKS_KEY, JSON.stringify(c)) }

export default function RoutineSection() {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm]   = useState(emptyForm)
  const [addingNew, setAddingNew] = useState(false)
  const [newForm, setNewForm]     = useState(emptyForm)

  const { data: items = [], isLoading } = useQuery<RoutineItem[]>({
    queryKey: ['routine'],
    queryFn: () => axios.get('/api/routine').then(r => r.data),
  })
  const { data: profile } = useQuery<BabyProfile>({
    queryKey: ['profile'],
    queryFn: () => axios.get('/api/profile').then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RoutineItem> }) =>
      axios.patch(`/api/routine/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['routine'] }); toast.success('Updated!'); setEditingId(null) },
    onError: () => toast.error('Failed to update'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/routine/${id}`).then(() => id),
    onSuccess: (id: string) => { qc.setQueryData(['routine'], (old: RoutineItem[] = []) => old.filter(i => i.id !== id)); toast.success('Removed') },
    onError: () => toast.error('Failed to delete'),
  })
  const createMutation = useMutation({
    mutationFn: (data: typeof newForm & { order: number }) => axios.post('/api/routine', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['routine'] }); toast.success('Added!'); setAddingNew(false); setNewForm(emptyForm) },
    onError: () => toast.error('Failed to add'),
  })

  function startEdit(item: RoutineItem) {
    setEditingId(item.id)
    setEditForm({ timeStart: item.timeStart, timeEnd: item.timeEnd ?? '', activity: item.activity, note: item.note ?? '', category: item.category })
  }
  function saveEdit(id: string) {
    if (!editForm.timeStart || !editForm.activity) { toast.error('Time and activity are required'); return }
    updateMutation.mutate({ id, data: { ...editForm, timeEnd: editForm.timeEnd || null, note: editForm.note || null } })
  }
  function submitNew() {
    if (!newForm.timeStart || !newForm.activity) { toast.error('Time and activity are required'); return }
    createMutation.mutate({ ...newForm, timeEnd: newForm.timeEnd || '', note: newForm.note || '', order: items.length })
  }

  const wakeItem = items.find(i => i.activity.toLowerCase().includes('wake'))
  const bedItem  = items.find(i => i.activity.toLowerCase().includes('bed') || i.activity.toLowerCase().includes('lights out'))
  const napItem  = items.find(i => i.activity.toLowerCase().includes('nap'))
  const babyName = profile?.name && profile.name !== 'Your Little One' ? profile.name : 'Your Little One'
  const ageStr   = calcAge(profile?.birthdate)

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-3 sm:space-y-4">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-[#FFE8D6] to-[#FFF4EC] rounded-2xl border border-orange-200 p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
        <span className="text-4xl sm:text-5xl leading-none select-none flex-shrink-0">⭐</span>
        <div className="flex-1 min-w-0">
          <h2 className="font-fredoka text-2xl sm:text-[2rem] leading-tight text-brand-500 truncate">{babyName}</h2>
          <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">
            {ageStr ? `${ageStr} · ` : ''}Today is {formatFullDate(new Date())}
          </p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
            {bedItem && (
              <span className="inline-flex items-center gap-1 bg-white border border-orange-100 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-bold text-gray-600">
                🌙 Bedtime {bedItem.timeStart}
              </span>
            )}
            {wakeItem && (
              <span className="inline-flex items-center gap-1 bg-white border border-orange-100 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-bold text-gray-600">
                ☀️ Wake {wakeItem.timeStart}
              </span>
            )}
            {napItem && (
              <span className="inline-flex items-center gap-1 bg-white border border-orange-100 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-bold text-gray-600">
                💤 Nap {napItem.timeStart}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Schedule ── */}
      <Card>
        <CardHeader icon="📅" title="Daily Routine Schedule">
          <Button variant="ghost" onClick={() => { setAddingNew(true); setNewForm(emptyForm) }} className="text-xs py-1.5 px-3">
            <Plus size={13} /> Add
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          {addingNew && (
            <div className="border-b border-orange-100 bg-orange-50/60 px-4 sm:px-5 py-4 space-y-2">
              <SectionLabel>New routine item</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Start (e.g. 8:00 AM)" value={newForm.timeStart} onChange={e => setNewForm(f => ({ ...f, timeStart: e.target.value }))} />
                <Input placeholder="End (optional)" value={newForm.timeEnd} onChange={e => setNewForm(f => ({ ...f, timeEnd: e.target.value }))} />
              </div>
              <Input placeholder="Activity name *" value={newForm.activity} onChange={e => setNewForm(f => ({ ...f, activity: e.target.value }))} />
              <Input placeholder="Note (optional)" value={newForm.note} onChange={e => setNewForm(f => ({ ...f, note: e.target.value }))} />
              <div className="flex gap-1.5 items-center flex-wrap">
                <span className="text-xs font-bold text-gray-500 mr-1">Category:</span>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setNewForm(f => ({ ...f, category: c }))}
                    className={`rounded-full transition-all ${newForm.category === c ? 'ring-2 ring-offset-1 ring-brand-400 scale-105' : 'opacity-50'}`}>
                    <Badge category={c} />
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={submitNew} disabled={createMutation.isPending}><Check size={13} /> Save</Button>
                <Button variant="ghost" onClick={() => setAddingNew(false)}><X size={13} /> Cancel</Button>
              </div>
            </div>
          )}
          <div className="divide-y divide-orange-50">
            {items.map(item => (
              <div key={item.id} className="group px-4 sm:px-5 py-3 sm:py-3.5">
                {editingId === item.id ? (
                  <div className="space-y-2 py-1">
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Start time" value={editForm.timeStart} onChange={e => setEditForm(f => ({ ...f, timeStart: e.target.value }))} />
                      <Input placeholder="End time" value={editForm.timeEnd} onChange={e => setEditForm(f => ({ ...f, timeEnd: e.target.value }))} />
                    </div>
                    <Input placeholder="Activity *" value={editForm.activity} onChange={e => setEditForm(f => ({ ...f, activity: e.target.value }))} />
                    <Input placeholder="Note" value={editForm.note} onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} />
                    <div className="flex gap-1.5 items-center flex-wrap">
                      <span className="text-xs font-bold text-gray-500 mr-1">Category:</span>
                      {CATEGORIES.map(c => (
                        <button key={c} onClick={() => setEditForm(f => ({ ...f, category: c }))}
                          className={`rounded-full transition-all ${editForm.category === c ? 'ring-2 ring-offset-1 ring-brand-400 scale-105' : 'opacity-50'}`}>
                          <Badge category={c} />
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button onClick={() => saveEdit(item.id)} disabled={updateMutation.isPending}><Check size={13} /> Save</Button>
                      <Button variant="ghost" onClick={() => setEditingId(null)}><X size={13} /> Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 sm:gap-3">
                    {/* Time */}
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 whitespace-nowrap min-w-[80px] sm:min-w-[96px] pt-1 leading-tight flex-shrink-0">
                      {item.timeStart}{item.timeEnd ? ` – ${item.timeEnd}` : ''}
                    </span>
                    {/* Dot */}
                    <span className={`mt-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0 ${DOT_COLORS[item.category] ?? 'bg-gray-400'}`} />
                    {/* Activity */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 leading-snug">{item.activity}</p>
                      {item.note && <p className="text-xs text-gray-400 font-medium mt-0.5 leading-snug">{item.note}</p>}
                    </div>
                    {/* Badge */}
                    <Badge category={item.category} />
                    {/* Actions — always visible on mobile, hover on desktop */}
                    <div className="flex gap-0.5 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(item)} className="p-2 sm:p-1.5 rounded-lg hover:bg-orange-50 text-gray-300 hover:text-brand-500 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteMutation.mutate(item.id)} className="p-2 sm:p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <EditableChecklist />
    </div>
  )
}

function EditableChecklist() {
  const [items, setItems]           = useState<string[]>(loadChecklistItems)
  const [checks, setChecks]         = useState<Record<number, boolean>>(loadChecks)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editValue, setEditValue]   = useState('')
  const [addingNew, setAddingNew]   = useState(false)
  const [newItem, setNewItem]       = useState('')

  useEffect(() => { saveChecklistItems(items) }, [items])
  useEffect(() => { saveChecks(checks) }, [checks])

  function toggle(i: number) { setChecks(c => ({ ...c, [i]: !c[i] })) }

  function startEdit(i: number) { setEditingIdx(i); setEditValue(items[i]) }

  function saveEdit(i: number) {
    if (!editValue.trim()) { toast.error('Cannot be empty'); return }
    setItems(prev => { const n = [...prev]; n[i] = editValue.trim(); return n })
    setEditingIdx(null)
  }

  function deleteItem(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i))
    setChecks(prev => {
      const next: Record<number, boolean> = {}
      Object.entries(prev).forEach(([k, v]) => {
        const ki = parseInt(k)
        if (ki < i) next[ki] = v
        else if (ki > i) next[ki - 1] = v
      })
      return next
    })
  }

  function addItem() {
    const t = newItem.trim()
    if (!t) { toast.error('Cannot be empty'); return }
    setItems(prev => [...prev, t])
    setNewItem('')
    setAddingNew(false)
    toast.success('Item added!')
  }

  function reset() { setChecks({}); toast.success('Checklist reset!') }

  const doneCount = Object.values(checks).filter(Boolean).length

  return (
    <Card>
      <CardHeader icon="✅" title={`Morning Checklist (${doneCount}/${items.length})`}>
        <div className="flex items-center gap-2">
          <button onClick={() => { setAddingNew(true); setEditingIdx(null) }}
            className="text-xs text-gray-400 hover:text-brand-500 font-bold transition-colors py-1 px-1">+ Add</button>
          <span className="text-gray-200 text-xs">|</span>
          <button onClick={reset} className="text-xs text-gray-400 hover:text-brand-500 font-bold transition-colors py-1 px-1">↺ Reset</button>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {addingNew && (
          <div className="border-b border-orange-100 bg-orange-50/60 px-4 sm:px-5 py-3 flex gap-2">
            <Input autoFocus placeholder="New checklist item..." value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addItem(); if (e.key === 'Escape') { setAddingNew(false); setNewItem('') } }}
              className="flex-1" />
            <button onClick={addItem} className="p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors flex-shrink-0"><Check size={16} /></button>
            <button onClick={() => { setAddingNew(false); setNewItem('') }} className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0"><X size={16} /></button>
          </div>
        )}
        <div className="divide-y divide-orange-50 px-4 sm:px-5">
          {items.map((item, i) => (
            <div key={i} className="group flex items-center gap-3 py-3">
              {editingIdx === i ? (
                <div className="flex gap-2 flex-1 items-center">
                  <Input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(i); if (e.key === 'Escape') setEditingIdx(null) }}
                    className="flex-1" />
                  <button onClick={() => saveEdit(i)} className="p-2 rounded-xl bg-green-50 text-green-600 flex-shrink-0"><Check size={14} /></button>
                  <button onClick={() => setEditingIdx(null)} className="p-2 rounded-xl bg-gray-50 text-gray-400 flex-shrink-0"><X size={14} /></button>
                </div>
              ) : (
                <>
                  <input type="checkbox" checked={!!checks[i]} onChange={() => toggle(i)}
                    className="w-5 h-5 accent-brand-500 cursor-pointer flex-shrink-0 rounded" />
                  <span onClick={() => toggle(i)}
                    className={`text-sm font-semibold flex-1 cursor-pointer select-none transition-colors leading-snug ${checks[i] ? 'line-through text-gray-300' : 'text-gray-700'}`}>
                    {item}
                  </span>
                  {/* Always visible on mobile */}
                  <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => startEdit(i)} className="p-2 rounded-lg text-gray-300 hover:text-brand-500 hover:bg-orange-50 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => deleteItem(i)} className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400 font-semibold">No items — click + Add above</p>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
