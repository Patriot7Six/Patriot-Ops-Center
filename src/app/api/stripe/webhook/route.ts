import { NextResponse, type NextRequest } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { sendSubscriptionEmail } from '@/lib/resend'
import type Stripe from 'stripe'
import type { SubscriptionTier, SubscriptionStatus } from '@/types/database'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        // Determine tier from price ID
        let tier: SubscriptionTier = 'free'
        const priceId = sub.items.data[0]?.price.id
        if (priceId === process.env.STRIPE_ELITE_PRICE_ID) tier = 'elite'
        else if (priceId === process.env.STRIPE_PRO_PRICE_ID) tier = 'pro'

        const status = sub.status as SubscriptionStatus

        await supabase
          .from('subscriptions')
          .update({
            stripe_subscription_id: sub.id,
            tier,
            status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        // Send subscription confirmation email for new active subscriptions
        if (event.type === 'customer.subscription.created' && status === 'active') {
          const { data: subRecord } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (subRecord) {
            const { data: { user } } = await supabase.auth.admin.getUserById(subRecord.user_id)
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', subRecord.user_id)
              .single()

            if (user?.email) {
              const firstName = profile?.full_name?.split(' ')[0] ?? 'Veteran'
              const planName = tier === 'elite' ? 'Special Ops' : 'Ranger'
              const nextBillingDate = new Date(sub.current_period_end * 1000)
                .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
              await sendSubscriptionEmail(user.email, firstName, planName, nextBillingDate)
            }
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await supabase
          .from('subscriptions')
          .update({
            tier: 'free',
            status: 'canceled',
            stripe_subscription_id: null,
            current_period_end: null,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', sub.customer as string)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', invoice.customer as string)
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
