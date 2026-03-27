'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Pencil, Trash2, Plus, Check, X, GripVertical } from 'lucide-react'
import { Card, CardHeader, CardBody, Button, Input, Badge, CategoryDot, SectionLabel, Spinner } from '@/components/ui'
import type { RoutineItem, Category } from '@/types'

const CATEGORIES: Category[] = ['sleep', 'meal', 'play', 'care', 'learn', 'outdoor']

const emptyForm = { timeStart: '', timeEnd: '', activity: '', note: '', category: 'play' as Category }

export default function RoutineSection() {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [addingNew, setAddingNew] = useState(false)
  const [newForm, setNewForm] = useState(emptyForm)

  const { data: items = [], isLoading } = useQuery<RoutineItem[]>({
    queryKey: ['routine'],
    queryFn: () => axios.get('/api/routine').then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RoutineItem> }) =>
      axios.patch(`/api/routine/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['routine'] }); toast.success('Routine updated!'); setEditingId(null) },
    onError: () => toast.error('Failed to update'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/routine/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['routine'] }); toast.success('Item removed') },
    onError: () => toast.error('Failed to delete'),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof newForm & { order: number }) => axios.post('/api/routine', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['routine'] }); toast.success('Item added!'); setAddingNew(false); setNewForm(emptyForm) },
    onError: () => toast.error('Failed to add item'),
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

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader icon="📅" title="Daily Routine Schedule">
          <Button variant="ghost" onClick={() => { setAddingNew(true); setNewForm(emptyForm) }} className="text-xs py-1.5 px-3">
            <Plus size={13} /> Add item
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          {addingNew && (
            <div className="border-b border-orange-100 bg-orange-50/60 px-5 py-3 space-y-2">
              <SectionLabel>New routine item</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Start time (e.g. 8:00 AM)" value={newForm.timeStart} onChange={e => setNewForm(f => ({ ...f, timeStart: e.target.value }))} />
                <Input placeholder="End time (optional)" value={newForm.timeEnd} onChange={e => setNewForm(f => ({ ...f, timeEnd: e.target.value }))} />
              </div>
              <Input placeholder="Activity name *" value={newForm.activity} onChange={e => setNewForm(f => ({ ...f, activity: e.target.value }))} />
              <Input placeholder="Note (optional)" value={newForm.note} onChange={e => setNewForm(f => ({ ...f, note: e.target.value }))} />
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-xs font-bold text-gray-500">Category:</span>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setNewForm(f => ({ ...f, category: c }))}
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-all ${newForm.category === c ? 'ring-2 ring-offset-1 ring-brand-400 scale-105' : 'opacity-60'}`}>
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
              <div key={item.id} className="group px-5 py-3">
                {editingId === item.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Start time" value={editForm.timeStart} onChange={e => setEditForm(f => ({ ...f, timeStart: e.target.value }))} />
                      <Input placeholder="End time" value={editForm.timeEnd} onChange={e => setEditForm(f => ({ ...f, timeEnd: e.target.value }))} />
                    </div>
                    <Input placeholder="Activity *" value={editForm.activity} onChange={e => setEditForm(f => ({ ...f, activity: e.target.value }))} />
                    <Input placeholder="Note" value={editForm.note} onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} />
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className="text-xs font-bold text-gray-500">Category:</span>
                      {CATEGORIES.map(c => (
                        <button key={c} onClick={() => setEditForm(f => ({ ...f, category: c }))}
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-all ${editForm.category === c ? 'ring-2 ring-offset-1 ring-brand-400 scale-105' : 'opacity-60'}`}>
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
                  <div className="flex items-start gap-3">
                    <GripVertical size={14} className="text-gray-200 mt-1 flex-shrink-0" />
                    <CategoryDot category={item.category} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap">
                          {item.timeStart}{item.timeEnd ? ` – ${item.timeEnd}` : ''}
                        </span>
                        <Badge category={item.category} />
                      </div>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{item.activity}</p>
                      {item.note && <p className="text-xs text-gray-400 font-semibold mt-0.5">{item.note}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-brand-500 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteMutation.mutate(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
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

      {/* Checklist */}
      <MorningChecklist />
    </div>
  )
}

const DEFAULT_CHECKS = [
  'Diaper / toilet check', 'Breakfast eaten', 'Teeth brushed',
  'Vitamins / supplements', 'Sunscreen applied', 'Change of clothes packed',
  'Nap bag packed (if going out)', 'Comfort toy ready for nap',
]

function MorningChecklist() {
  const [checks, setChecks] = useState<Record<number, boolean>>(() => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem('babyhub_checks') || '{}') } catch { return {} }
  })

  function toggle(i: number) {
    const next = { ...checks, [i]: !checks[i] }
    setChecks(next)
    localStorage.setItem('babyhub_checks', JSON.stringify(next))
  }

  function reset() {
    setChecks({})
    localStorage.removeItem('babyhub_checks')
    toast.success('Checklist reset!')
  }

  return (
    <Card>
      <CardHeader icon="✅" title="Morning Checklist">
        <button onClick={reset} className="text-xs text-gray-400 hover:text-brand-500 font-bold transition-colors">↺ Reset</button>
      </CardHeader>
      <CardBody>
        <div className="divide-y divide-orange-50">
          {DEFAULT_CHECKS.map((item, i) => (
            <label key={i} className="flex items-center gap-3 py-2.5 cursor-pointer group">
              <input type="checkbox" checked={!!checks[i]} onChange={() => toggle(i)}
                className="w-4 h-4 accent-brand-500 cursor-pointer flex-shrink-0" />
              <span className={`text-sm font-semibold transition-colors ${checks[i] ? 'line-through text-gray-300' : 'text-gray-700'}`}>{item}</span>
            </label>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
