import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitHeaders } from '@/lib/ratelimit'
import type { SubscriptionTier } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check Pro/Elite subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .single()

    const isActive = ['active', 'trialing'].includes(subscription?.status ?? '')
    const tier = ((isActive ? subscription?.tier : 'free') as SubscriptionTier) ?? 'free'
    const hasTier = tier === 'pro' || tier === 'elite'

    if (!hasTier) {
      return NextResponse.json({ error: 'Upgrade required' }, { status: 403 })
    }

    // Rate-limit uploads the same way we rate-limit AI requests — a single
    // upload causes an automatic AI analysis job to run, so it should cost
    // one unit against the user's quota.
    const rateResult = await checkRateLimit(user.id, tier)
    if (!rateResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Daily limit reached. Resets at ${new Date(rateResult.reset).toLocaleTimeString()}.`,
          reset: rateResult.reset,
        },
        { status: 429, headers: rateLimitHeaders(rateResult) },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Limit file size to 20MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 })
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()
    const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false })

    if (uploadError) throw uploadError

    const serviceClient = await createServiceClient()
    const { data: doc, error: dbError } = await serviceClient
      .from('documents')
      .insert({
        user_id: user.id,
        name: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        size_bytes: file.size,
        // Kick off as 'queued' so the UI can show a pending state
        // until the Trigger.dev job picks it up and flips to 'analyzing'.
        status: 'queued',
      })
      .select()
      .single()

    if (dbError) throw dbError

    // Fire the background AI-analysis Trigger job. We don't await it — the
    // task runs on Trigger.dev infrastructure and updates the DB record
    // when complete. If the trigger call itself fails, we just leave the
    // doc as 'queued' and surface an on-demand re-analyze button in the UI.
    try {
      const { analyzeDocumentJob } = await import('../../../../../trigger/jobs/documents')
      await analyzeDocumentJob.trigger({
        documentId: doc.id,
        storagePath,
        mimeType: file.type,
        documentName: file.name,
        userId: user.id,
      })
    } catch (triggerErr) {
      console.error('Failed to enqueue analyzeDocumentJob:', triggerErr)
    }

    return NextResponse.json({
      document: doc,
      rateLimit: rateLimitHeaders(rateResult),
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
