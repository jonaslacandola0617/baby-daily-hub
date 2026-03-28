'use client'

import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ icon, title, children }: { icon: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-orange-100">
      <span className="text-base sm:text-lg flex-shrink-0">{icon}</span>
      <h2 className="font-nunito font-extrabold text-sm text-gray-800 flex-1 truncate">{title}</h2>
      {children}
    </div>
  )
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-4 sm:px-5 py-4', className)}>{children}</div>
}

export function Button({
  variant = 'primary', className, children, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-nunito text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variant === 'primary' && 'bg-brand-500 text-white hover:bg-brand-600',
        variant === 'ghost'   && 'bg-orange-50 text-gray-700 hover:bg-orange-100 border border-orange-100',
        variant === 'danger'  && 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2.5 rounded-xl border border-orange-100 bg-orange-50 font-nunito text-sm font-semibold text-gray-800 outline-none focus:border-brand-400 focus:bg-white transition-colors placeholder:text-gray-300',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full px-3 py-2.5 rounded-xl border border-orange-100 bg-orange-50 font-nunito text-sm font-semibold text-gray-800 outline-none focus:border-brand-400 focus:bg-white transition-colors placeholder:text-gray-300 resize-none',
        className,
      )}
      {...props}
    />
  )
}

export function Badge({ category }: { category: string }) {
  const map: Record<string, string> = {
    sleep:   'bg-blue-100 text-blue-800',
    meal:    'bg-green-100 text-green-800',
    play:    'bg-amber-100 text-amber-800',
    care:    'bg-purple-100 text-purple-800',
    learn:   'bg-teal-100 text-teal-800',
    outdoor: 'bg-orange-100 text-orange-800',
  }
  const labels: Record<string, string> = {
    sleep: 'Sleep', meal: 'Meal', play: 'Play', care: 'Care', learn: 'Learning', outdoor: 'Outdoor',
  }
  return (
    <span className={cn('text-[10px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0', map[category] ?? 'bg-gray-100 text-gray-700')}>
      {labels[category] ?? category}
    </span>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-extrabold tracking-widest uppercase text-gray-400 mb-1.5">{children}</p>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-orange-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )
}
