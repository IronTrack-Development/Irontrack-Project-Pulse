import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServiceClient } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

// POST /api/stripe/sub-checkout
// Creates a Stripe Checkout session for the $10/month sub progress report subscription.
// Body: { sub_company_id: string, return_url: string }
export async function POST(req: NextRequest) {
  let body: { sub_company_id?: string; return_url?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sub_company_id, return_url } = body;

  if (!sub_company_id) {
    return NextResponse.json({ error: "sub_company_id is required" }, { status: 400 });
  }
  if (!return_url) {
    return NextResponse.json({ error: "return_url is required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Fetch sub company details
  const { data: subCompany, error: subError } = await supabase
    .from("sub_companies")
    .select("id, company_name, contact_email, stripe_customer_id, subscription_status")
    .eq("id", sub_company_id)
    .single();

  if (subError || !subCompany) {
    return NextResponse.json({ error: "Sub company not found" }, { status: 404 });
  }

  // If already active, return a manage URL instead
  if (subCompany.subscription_status === "active") {
    return NextResponse.json(
      { error: "Subscription already active" },
      { status: 409 }
    );
  }

  let customerId = subCompany.stripe_customer_id;

  // Create or reuse Stripe customer
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: subCompany.company_name,
      email: subCompany.contact_email ?? undefined,
      metadata: { sub_company_id },
    });
    customerId = customer.id;

    // Save customer ID for future use
    await supabase
      .from("sub_companies")
      .update({ stripe_customer_id: customerId })
      .eq("id", sub_company_id);
  }

  // Determine price: use env var if set, otherwise look up or create
  let priceId = process.env.STRIPE_SUB_PRICE_ID;

  if (!priceId) {
    // Create a recurring $10/month price on-the-fly (in production, set STRIPE_SUB_PRICE_ID)
    const price = await stripe.prices.create({
      unit_amount: 1000, // $10.00 in cents
      currency: "usd",
      recurring: { interval: "month" },
      product_data: {
        name: "IronTrack Progress Reports — Monthly",
        metadata: { product_type: "sub_progress_reports" },
      },
    });
    priceId = price.id;
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${return_url}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${return_url}?checkout=cancelled`,
    metadata: {
      sub_company_id,
    },
    subscription_data: {
      metadata: {
        sub_company_id,
      },
    },
  });

  return NextResponse.json({ url: session.url, session_id: session.id });
}
