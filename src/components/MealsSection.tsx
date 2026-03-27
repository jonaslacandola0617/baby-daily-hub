'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Plus, Trash2, Check, X } from 'lucide-react'
import { Card, CardHeader, CardBody, Button, Input, SectionLabel, Spinner } from '@/components/ui'
import { today } from '@/lib/utils'
import type { MealLog } from '@/types'

const MEAL_SLOTS = [
  { key: 'breakfast' as const, icon: '🌅', label: 'Breakfast', placeholder: 'e.g. Oatmeal + banana\nWhole milk' },
  { key: 'lunch'     as const, icon: '☀️', label: 'Lunch',     placeholder: 'e.g. Rice + chicken\nSteamed veggies' },
  { key: 'dinner'    as const, icon: '🌙', label: 'Dinner',    placeholder: 'e.g. Pasta + veggies\nSoft fruit pieces' },
  { key: 'snacks'    as const, icon: '🍎', label: 'Snacks',    placeholder: 'e.g. Crackers + fruit at 4pm' },
]

// Vitamins are stored two ways:
//   vitamins: { "Vitamin C": true, "Iron": false, ... }  — checked state
//   vitaminList: ["Vitamin C", "Iron", ...]               — the ordered list of names
// We persist vitaminList in localStorage so it survives page refreshes without a new API field.
const VITAMIN_LIST_KEY = 'babyhub_vitaminList'

function loadVitaminList(): string[] {
  if (typeof window === 'undefined') return ['Vitamin C']
  try {
    const saved = localStorage.getItem(VITAMIN_LIST_KEY)
    return saved ? JSON.parse(saved) : ['Vitamin C']
  } catch { return ['Vitamin C'] }
}

function saveVitaminList(list: string[]) {
  localStorage.setItem(VITAMIN_LIST_KEY, JSON.stringify(list))
}

export default function MealsSection() {
  const qc = useQueryClient()
  const date = today()

  const [vitaminList, setVitaminList] = useState<string[]>(loadVitaminList)
  const [addingVitamin, setAddingVitamin] = useState(false)
  const [newVitamin, setNewVitamin] = useState('')

  const { data: meals, isLoading } = useQuery<MealLog>({
    queryKey: ['meals', date],
    queryFn: () => axios.get(`/api/meals?date=${date}`).then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: (data: Partial<MealLog> & { date: string }) =>
      axios.put('/api/meals', data).then(r => r.data),
    onSuccess: (data) => { qc.setQueryData(['meals', date], data) },
    onError: () => toast.error('Failed to save'),
  })

  function update(field: keyof MealLog, value: unknown) {
    mutation.mutate({ date, [field]: value })
  }

  function toggleVitamin(name: string) {
    const current = meals?.vitamins ?? {}
    const next = { ...current, [name]: !current[name] }
    update('vitamins', next)
  }

  function addVitamin() {
    const name = newVitamin.trim()
    if (!name) return
    if (vitaminList.includes(name)) { toast.error('Already in list'); return }
    const next = [...vitaminList, name]
    setVitaminList(next)
    saveVitaminList(next)
    setNewVitamin('')
    setAddingVitamin(false)
    toast.success(`${name} added!`)
  }

  function removeVitamin(name: string) {
    const next = vitaminList.filter(v => v !== name)
    setVitaminList(next)
    saveVitaminList(next)
    // Also clear its checked state from the DB
    const current = meals?.vitamins ?? {}
    const nextVitamins = { ...current }
    delete nextVitamins[name]
    update('vitamins', nextVitamins)
    toast.success(`${name} removed`)
  }

  if (isLoading) return <Spinner />
  if (!meals) return null

  const vitamins = meals.vitamins ?? {}

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader icon="🍽️" title="Today's Meals" />
        <CardBody>
          <div className="grid sm:grid-cols-2 gap-3">
            {MEAL_SLOTS.map(slot => (
              <div key={slot.key} className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5">
                  {slot.icon} {slot.label}
                </p>
                <MealTextarea
                  value={meals[slot.key] ?? ''}
                  placeholder={slot.placeholder}
                  onCommit={v => update(slot.key, v)}
                />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon="💊" title="Vitamins & Supplements">
          <Button variant="ghost" onClick={() => setAddingVitamin(true)} className="text-xs py-1.5 px-3">
            <Plus size={13} /> Add
          </Button>
        </CardHeader>
        <CardBody>
          {addingVitamin && (
            <div className="flex gap-2 mb-3">
              <Input
                autoFocus
                placeholder="e.g. Vitamin C, Iron..."
                value={newVitamin}
                onChange={e => setNewVitamin(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addVitamin(); if (e.key === 'Escape') { setAddingVitamin(false); setNewVitamin('') } }}
                className="flex-1"
              />
              <Button onClick={addVitamin}><Check size={13} /></Button>
              <Button variant="ghost" onClick={() => { setAddingVitamin(false); setNewVitamin('') }}><X size={13} /></Button>
            </div>
          )}

          {vitaminList.length === 0 && (
            <p className="text-sm text-gray-400 font-semibold py-2">No vitamins added yet — click Add above</p>
          )}

          <SectionLabel>Tap to mark as given today</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
            {vitaminList.map(v => {
              const done = !!vitamins[v]
              return (
                <div key={v} className="relative group">
                  <button
                    onClick={() => toggleVitamin(v)}
                    className={`w-full py-3 px-3 rounded-xl border-2 text-sm font-bold transition-all active:scale-95 text-center ${
                      done
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}
                  >
                    <span className="block text-lg mb-0.5">{done ? '✅' : '💊'}</span>
                    {v}
                  </button>
                  {/* Remove button — appears on hover */}
                  <button
                    onClick={() => removeVitamin(v)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-100 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-200"
                    title="Remove"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

function MealTextarea({ value, onCommit, placeholder }: {
  value: string; onCommit: (v: string) => void; placeholder?: string
}) {
  const [local, setLocal] = useState(value)
  useEffect(() => { setLocal(value) }, [value])
  const commit = useCallback(() => { if (local !== value) onCommit(local) }, [local, value, onCommit])
  return (
    <textarea
      value={local}
      placeholder={placeholder}
      onChange={e => setLocal(e.target.value)}
      onBlur={commit}
      rows={3}
      className="w-full bg-transparent font-nunito text-sm font-semibold text-gray-700 outline-none resize-none placeholder:text-gray-300 leading-relaxed"
    />
  )
}
