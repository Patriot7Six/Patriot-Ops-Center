import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — list user's documents
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ documents: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

// DELETE — delete a document by id
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()

    // Get storage path before deleting
    const { data: doc } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    // Delete from storage
    await supabase.storage.from('documents').remove([doc.storage_path])

    // Delete from DB
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
