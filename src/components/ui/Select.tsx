import * as React from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, placeholder, ...props }, ref) => {
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
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm',
            'focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/30',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all appearance-none',
            error && 'border-red-500/50',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" className="bg-navy-900">
              {placeholder}
            </option>
          )}
          {options.map(o => (
            <option key={o.value} value={o.value} className="bg-navy-900">
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  },
)
Select.displayName = 'Select'
