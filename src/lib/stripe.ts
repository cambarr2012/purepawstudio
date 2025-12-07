// src/lib/stripe.ts
// Keep this tiny and TypeScript-friendly for CI.

import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment");
}

// Don’t specify apiVersion – use the SDK’s default for this package version.
export const stripe = new Stripe(secretKey);

export default stripe;
