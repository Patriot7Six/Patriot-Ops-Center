import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

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
    const hasTier = isActive && (subscription?.tier === 'pro' || subscription?.tier === 'elite')

    if (!hasTier) {
      return NextResponse.json({ error: 'Upgrade required' }, { status: 403 })
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
        status: 'ready',
      })
      .select()
      .single()

    if (dbError) throw dbError

    return NextResponse.json({ document: doc })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
