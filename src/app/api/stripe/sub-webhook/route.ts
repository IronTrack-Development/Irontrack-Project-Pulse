import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServiceClient } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// POST /api/stripe/sub-webhook
// Handles Stripe webhook events for sub subscriptions.
// Set your Stripe webhook endpoint to this URL and listen for:
//   - checkout.session.completed
//   - customer.subscription.deleted
//   - customer.subscription.updated
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // Dev fallback: parse without verification (not safe for production)
      console.warn("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set — skipping signature verification");
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const supabase = getServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subCompanyId = session.metadata?.sub_company_id;
        if (!subCompanyId) break;

        // Retrieve the subscription to get period end (in v22+, period end is on items)
        let subscriptionEndsAt: string | null = null;
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const periodEnd = subscription.items?.data?.[0]?.current_period_end;
          if (periodEnd) {
            subscriptionEndsAt = new Date(periodEnd * 1000).toISOString();
          }
        }

        await supabase
          .from("sub_companies")
          .update({
            subscription_status: "active",
            stripe_customer_id: session.customer as string,
            subscription_ends_at: subscriptionEndsAt,
          })
          .eq("id", subCompanyId);

        console.log(`[stripe-webhook] subscription activated for sub_company_id=${subCompanyId}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const subCompanyId = subscription.metadata?.sub_company_id;
        if (!subCompanyId) {
          // Try to look up by customer_id
          const { data: company } = await supabase
            .from("sub_companies")
            .select("id")
            .eq("stripe_customer_id", subscription.customer as string)
            .single();
          if (!company) break;

          const isActive = subscription.status === "active";
          const periodEnd0 = subscription.items?.data?.[0]?.current_period_end;
          await supabase
            .from("sub_companies")
            .update({
              subscription_status: isActive ? "active" : subscription.status,
              subscription_ends_at: periodEnd0 ? new Date(periodEnd0 * 1000).toISOString() : null,
            })
            .eq("id", company.id);
          break;
        }

        const isActive = subscription.status === "active";
        const periodEndB = subscription.items?.data?.[0]?.current_period_end;
        await supabase
          .from("sub_companies")
          .update({
            subscription_status: isActive ? "active" : subscription.status,
            subscription_ends_at: periodEndB ? new Date(periodEndB * 1000).toISOString() : null,
          })
          .eq("id", subCompanyId);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subCompanyId = subscription.metadata?.sub_company_id;

        if (subCompanyId) {
          const periodEndD = subscription.items?.data?.[0]?.current_period_end;
          await supabase
            .from("sub_companies")
            .update({
              subscription_status: "inactive",
              subscription_ends_at: periodEndD ? new Date(periodEndD * 1000).toISOString() : null,
            })
            .eq("id", subCompanyId);
        } else {
          // Fall back to customer_id lookup
          await supabase
            .from("sub_companies")
            .update({ subscription_status: "inactive" })
            .eq("stripe_customer_id", subscription.customer as string);
        }

        console.log(`[stripe-webhook] subscription deleted for customer=${subscription.customer}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        // Mark as past_due so the app can prompt re-subscription
        await supabase
          .from("sub_companies")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", invoice.customer as string);
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }
  } catch (err) {
    console.error(`[stripe-webhook] error processing event ${event.type}:`, err);
    // Return 200 anyway so Stripe doesn't retry indefinitely
  }

  return NextResponse.json({ received: true });
}
