'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Plus, Trash2, Check, X } from 'lucide-react'
import { Card, CardHeader, CardBody, Button, Input, SectionLabel, Spinner } from '@/components/ui'
import type { Milestone, MilestoneStatus } from '@/types'

const STATUS_CONFIG: Record<MilestoneStatus, { label: string; dot: string; badge: string }> = {
  done:     { label: 'Achieved',    dot: 'bg-green-400',  badge: 'bg-green-100 text-green-800' },
  progress: { label: 'In progress', dot: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-800' },
  pending:  { label: 'Not yet',     dot: 'bg-gray-300',   badge: 'bg-gray-100 text-gray-500' },
}

const STATUSES: MilestoneStatus[] = ['done', 'progress', 'pending']

export default function MilestonesSection() {
  const qc = useQueryClient()
  const [addingNew, setAddingNew] = useState(false)
  const [newForm, setNewForm] = useState({ text: '', category: '', status: 'pending' as MilestoneStatus })

  const { data: milestones = [], isLoading } = useQuery<Milestone[]>({
    queryKey: ['milestones'],
    queryFn: () => axios.get('/api/milestones').then(r => r.data),
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
    mutationFn: (id: string) => axios.delete(`/api/milestones/${id}`),
    onSuccess: (_, id) => {
      qc.setQueryData(['milestones'], (old: Milestone[] = []) => old.filter(m => m.id !== id))
      toast.success('Milestone removed')
    },
    onError: () => toast.error('Failed to delete'),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof newForm & { order: number }) => axios.post('/api/milestones', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['milestones'] }); toast.success('Milestone added!'); setAddingNew(false); setNewForm({ text: '', category: '', status: 'pending' }) },
    onError: () => toast.error('Failed to add'),
  })

  function submitNew() {
    if (!newForm.text || !newForm.category) { toast.error('Text and category are required'); return }
    createMutation.mutate({ ...newForm, order: milestones.length })
  }

  const grouped = milestones.reduce<Record<string, Milestone[]>>((acc, m) => {
    acc[m.category] = acc[m.category] ? [...acc[m.category], m] : [m]
    return acc
  }, {})

  const doneCount = milestones.filter(m => m.status === 'done').length
  const progressCount = milestones.filter(m => m.status === 'progress').length

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Achieved', count: doneCount, color: 'bg-green-50 text-green-700 border-green-100' },
          { label: 'In progress', count: progressCount, color: 'bg-amber-50 text-amber-700 border-amber-100' },
          { label: 'Total tracked', count: milestones.length, color: 'bg-orange-50 text-brand-600 border-orange-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl px-4 py-3 text-center border ${s.color}`}>
            <p className="font-fredoka text-2xl">{s.count}</p>
            <p className="text-[11px] font-bold mt-0.5 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader icon="⭐" title="Development Milestones — 24 months">
          <Button variant="ghost" onClick={() => setAddingNew(true)} className="text-xs py-1.5 px-3">
            <Plus size={13} /> Add
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          {addingNew && (
            <div className="border-b border-orange-100 bg-orange-50/60 px-5 py-3 space-y-2">
              <SectionLabel>New milestone</SectionLabel>
              <Input placeholder="Milestone description *" value={newForm.text} onChange={e => setNewForm(f => ({ ...f, text: e.target.value }))} />
              <Input placeholder="Category (e.g. Language, Motor) *" value={newForm.category} onChange={e => setNewForm(f => ({ ...f, category: e.target.value }))} />
              <div className="flex gap-2 items-center">
                <span className="text-xs font-bold text-gray-500">Status:</span>
                {STATUSES.map(s => (
                  <button key={s} onClick={() => setNewForm(f => ({ ...f, status: s }))}
                    className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${newForm.status === s ? 'ring-2 ring-offset-1 ring-brand-400' : 'opacity-60'} ${STATUS_CONFIG[s].badge}`}>
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={submitNew} disabled={createMutation.isPending}><Check size={13} /> Save</Button>
                <Button variant="ghost" onClick={() => setAddingNew(false)}><X size={13} /> Cancel</Button>
              </div>
            </div>
          )}

          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="px-5 py-2 bg-orange-50/50 border-b border-orange-100">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">{category}</span>
              </div>
              <div className="divide-y divide-orange-50">
                {items.map(m => {
                  const cfg = STATUS_CONFIG[m.status as MilestoneStatus] ?? STATUS_CONFIG.pending
                  return (
                    <div key={m.id} className="group flex items-center gap-3 px-5 py-3">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <p className="text-sm font-bold text-gray-800 flex-1">{m.text}</p>
                      <select
                        value={m.status}
                        onChange={e => updateMutation.mutate({ id: m.id, data: { status: e.target.value as MilestoneStatus } })}
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border-0 outline-none cursor-pointer ${cfg.badge}`}>
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                        ))}
                      </select>
                      <button onClick={() => deleteMutation.mutate(m.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  )
}
