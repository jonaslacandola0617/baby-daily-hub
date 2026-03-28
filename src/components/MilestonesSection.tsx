'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Plus, Trash2, Check, X, ChevronDown } from 'lucide-react'
import { Card, CardHeader, CardBody, Button, Input, SectionLabel, Spinner } from '@/components/ui'
import type { Milestone, MilestoneStatus } from '@/types'

const STATUS_CONFIG: Record<MilestoneStatus, { label: string; dot: string; badge: string }> = {
  done:     { label: 'Achieved',    dot: 'bg-green-400',  badge: 'bg-green-100 text-green-800' },
  progress: { label: 'In progress', dot: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-800' },
  pending:  { label: 'Not yet',     dot: 'bg-gray-300',   badge: 'bg-gray-100 text-gray-500' },
}
const STATUSES: MilestoneStatus[] = ['done', 'progress', 'pending']

const CATEGORY_SUGGESTIONS = [
  'Language', 'Gross motor', 'Fine motor', 'Cognitive',
  'Social', 'Self-care', 'Emotional', 'Sensory',
]

export default function MilestonesSection() {
  const qc = useQueryClient()
  const [addingNew, setAddingNew] = useState(false)
  const [newForm, setNewForm]     = useState({ text: '', category: '', status: 'pending' as MilestoneStatus })
  const [showSuggestions, setShowSuggestions] = useState(false)

  const { data: milestones = [], isLoading } = useQuery<Milestone[]>({
    queryKey: ['milestones'],
    queryFn:  () => axios.get('/api/milestones').then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Milestone> }) =>
      axios.patch(`/api/milestones/${id}`, data).then(r => r.data),
    onSuccess: (updated: Milestone) => {
      qc.setQueryData(['milestones'], (old: Milestone[] = []) =>
        old.map(m => m.id === updated.id ? updated : m))
    },
    onError: () => toast.error('Failed to update'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/milestones/${id}`).then(() => id),
    onSuccess: (deletedId: string) => {
      qc.setQueryData(['milestones'], (old: Milestone[] = []) =>
        old.filter(m => m.id !== deletedId))
      toast.success('Removed')
    },
    onError: () => toast.error('Failed to delete'),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof newForm & { order: number }) =>
      axios.post('/api/milestones', data).then(r => r.data),
    onSuccess: (created: Milestone) => {
      qc.setQueryData(['milestones'], (old: Milestone[] = []) => [...old, created])
      toast.success('Added!')
      setAddingNew(false)
      setNewForm({ text: '', category: '', status: 'pending' })
      setShowSuggestions(false)
    },
    onError: () => toast.error('Failed to add'),
  })

  function submitNew() {
    if (!newForm.text.trim() || !newForm.category.trim()) { toast.error('Description and category required'); return }
    createMutation.mutate({ ...newForm, order: milestones.length })
  }

  const grouped = milestones.reduce<Record<string, Milestone[]>>((acc, m) => {
    if (!acc[m.category]) acc[m.category] = []
    acc[m.category].push(m)
    return acc
  }, {})

  const doneCount     = milestones.filter(m => m.status === 'done').length
  const progressCount = milestones.filter(m => m.status === 'progress').length

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-3 sm:space-y-4">

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Achieved',     count: doneCount,         color: 'bg-green-50 text-green-700 border-green-100' },
          { label: 'In progress',  count: progressCount,     color: 'bg-amber-50 text-amber-700 border-amber-100' },
          { label: 'Total',        count: milestones.length, color: 'bg-orange-50 text-brand-600 border-orange-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl px-2 sm:px-4 py-3 text-center border ${s.color}`}>
            <p className="font-fredoka text-2xl sm:text-2xl">{s.count}</p>
            <p className="text-[10px] sm:text-[11px] font-bold mt-0.5 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader icon="⭐" title="Development Milestones">
          <Button variant="ghost" onClick={() => { setAddingNew(true); setShowSuggestions(false) }} className="text-xs py-1.5 px-3">
            <Plus size={13} /> Add
          </Button>
        </CardHeader>
        <CardBody className="p-0">

          {addingNew && (
            <div className="border-b border-orange-100 bg-orange-50/60 px-4 sm:px-5 py-4 space-y-3">
              <SectionLabel>New milestone</SectionLabel>
              <Input placeholder="Milestone description *" value={newForm.text}
                onChange={e => setNewForm(f => ({ ...f, text: e.target.value }))} />

              {/* Category with suggestions */}
              <div>
                <div className="flex gap-2">
                  <Input placeholder="Category * (type or pick below)" value={newForm.category}
                    onChange={e => setNewForm(f => ({ ...f, category: e.target.value }))}
                    onFocus={() => setShowSuggestions(true)} className="flex-1" />
                  <button onClick={() => setShowSuggestions(s => !s)}
                    className="px-2.5 rounded-xl border border-orange-100 bg-orange-50 text-gray-400 hover:text-brand-500 transition-colors flex-shrink-0">
                    <ChevronDown size={14} />
                  </button>
                </div>
                {showSuggestions && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {CATEGORY_SUGGESTIONS.map(cat => (
                      <button key={cat}
                        onClick={() => { setNewForm(f => ({ ...f, category: cat })); setShowSuggestions(false) }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all active:scale-95 ${
                          newForm.category === cat
                            ? 'bg-brand-500 text-white border-brand-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-500'
                        }`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status picker */}
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-xs font-bold text-gray-500">Status:</span>
                {STATUSES.map(s => (
                  <button key={s} onClick={() => setNewForm(f => ({ ...f, status: s }))}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all active:scale-95 ${
                      newForm.status === s ? 'ring-2 ring-offset-1 ring-brand-400' : 'opacity-60'
                    } ${STATUS_CONFIG[s].badge}`}>
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <Button onClick={submitNew} disabled={createMutation.isPending}><Check size={13} /> Save</Button>
                <Button variant="ghost" onClick={() => { setAddingNew(false); setShowSuggestions(false) }}><X size={13} /> Cancel</Button>
              </div>
            </div>
          )}

          {Object.entries(grouped).map(([category, items]) => (
            <div key={`cat-${category}`}>
              <div className="px-4 sm:px-5 py-2 bg-orange-50/50 border-b border-t border-orange-100">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">{category}</span>
              </div>
              <div className="divide-y divide-orange-50">
                {items.map(m => {
                  const cfg = STATUS_CONFIG[m.status as MilestoneStatus] ?? STATUS_CONFIG.pending
                  return (
                    <div key={`milestone-${m.id}`} className="group flex items-center gap-3 px-4 sm:px-5 py-3">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <p className="text-sm font-bold text-gray-800 flex-1 leading-snug">{m.text}</p>
                      {/* Select styled as pill */}
                      <select value={m.status}
                        onChange={e => updateMutation.mutate({ id: m.id, data: { status: e.target.value as MilestoneStatus } })}
                        className={`text-[10px] font-extrabold px-2.5 py-1.5 rounded-full border-0 outline-none cursor-pointer ${cfg.badge}`}>
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                        ))}
                      </select>
                      {/* Always visible delete on mobile */}
                      <button onClick={() => deleteMutation.mutate(m.id)}
                        disabled={deleteMutation.isPending}
                        className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {milestones.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-400 font-semibold">
              No milestones yet — add your first one above
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
