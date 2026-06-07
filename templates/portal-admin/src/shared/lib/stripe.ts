import { loadStripe } from "@stripe/stripe-js"
import { logger } from "@/lib/logger"

const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

if (!key) {
    logger.warn("VITE_STRIPE_PUBLISHABLE_KEY is not set. Payment features will not work.")
}

export const stripePromise = key
    ? loadStripe(key).catch((err) => {
        logger.error("Failed to load Stripe.js:", err)
        return null
    })
    : null
