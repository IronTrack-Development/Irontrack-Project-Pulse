import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import Stripe from 'stripe';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia',
  });
}

function getWebhookSecret() {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }
  return process.env.STRIPE_WEBHOOK_SECRET;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    const stripe = getStripe();
    const webhookSecret = getWebhookSecret();

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Webhook signature verification failed:', error.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;

        if (userId && session.subscription) {
          // Update subscription status
          await supabase
            .from('user_subscriptions')
            .update({
              stripe_subscription_id: session.subscription as string,
              stripe_customer_id: session.customer as string,
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by customer ID
        const { data: userSub } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single();

        if (userSub) {
          const updateData: Record<string, unknown> = {
            status: subscription.status,
            updated_at: new Date().toISOString(),
          };

          // Add current_period_end if it exists
          if ('current_period_end' in subscription && typeof subscription.current_period_end === 'number') {
            updateData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
          }

          await supabase
            .from('user_subscriptions')
            .update(updateData)
            .eq('user_id', userSub.user_id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by customer ID
        const { data: userSub } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single();

        if (userSub) {
          await supabase
            .from('user_subscriptions')
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userSub.user_id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Webhook error:', err);
    return NextResponse.json(
      { error: err.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
