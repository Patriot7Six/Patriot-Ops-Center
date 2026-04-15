import * as React from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
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
        <textarea
          ref={ref}
          id={inputId}
          rows={4}
          className={cn(
            'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm resize-none',
            'placeholder:text-slate-600',
            'focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/30',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all',
            error && 'border-red-500/50',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'
