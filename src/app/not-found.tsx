import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Page Not Found',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-extrabold text-gold-500/20 mb-4 leading-none">404</p>
        <h1 className="text-2xl font-extrabold text-white mb-2">Page not found</h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="md" asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button variant="secondary" size="md" asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
