// src/components/ui/Input.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-slate-400 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm',
            'placeholder:text-slate-600',
            'focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/30',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all',
            error && 'border-red-500/50 focus:border-red-500/60 focus:ring-red-500/30',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'
