import { NextResponse, type NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { PLANS } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

// Beta: https://beta.patriot-ops.com — Production: https://patriot-ops.com
// Set NEXT_PUBLIC_APP_URL in Vercel env vars to switch between environments
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://beta.patriot-ops.com'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tier } = await request.json()
    const plan = PLANS.find(p => p.tier === tier)

    if (!plan || !plan.priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Get or create Stripe customer
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = subscription?.stripe_customer_id

    if (!customerId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name ?? undefined,
        metadata: { user_id: user.id },
      })
      customerId = customer.id

      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${APP_URL}/dashboard/billing?success=1`,
      cancel_url: `${APP_URL}/dashboard/billing?canceled=1`,
      metadata: { user_id: user.id, tier },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
