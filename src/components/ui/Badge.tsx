import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border',
  {
    variants: {
      variant: {
        default: 'bg-white/5 border-white/10 text-slate-400',
        gold:    'bg-gold-500/10 border-gold-500/30 text-gold-400',
        green:   'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        purple:  'bg-purple-500/10 border-purple-500/30 text-purple-300',
        red:     'bg-red-500/10 border-red-500/30 text-red-400',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />
}
