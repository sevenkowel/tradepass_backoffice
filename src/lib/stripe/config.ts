import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY || "";

// Check if we're using placeholder keys (dev mode)
export const isStripeConfigured =
  secretKey && !secretKey.includes("placeholder");

export const stripe = isStripeConfigured
  ? new Stripe(secretKey, { apiVersion: "2025-03-31.basil" as any })
  : (null as unknown as Stripe);
