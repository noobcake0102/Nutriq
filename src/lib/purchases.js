import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor'
import { Capacitor } from '@capacitor/core'

// Set your RevenueCat API key here once you have it from revenuecat.com
// Dashboard → Project → API Keys → Apple App Store public key (starts with appl_)
export const RC_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || ''

export const ENTITLEMENTS = {
  PLUS: 'plus',
}

export const PRODUCTS = {
  PLUS_ANNUAL: 'com.nutriq.plus.annual',
  PLUS_MONTHLY: 'com.nutriq.plus.monthly',
}

// Free + Plus. Annual is the hero (priced as ~2 months free vs monthly).
export const PLANS = [
  {
    id: PRODUCTS.PLUS_ANNUAL,
    entitlement: ENTITLEMENTS.PLUS,
    name: 'Plus — Yearly',
    price: '$49/yr',
    sub: 'Just $4/mo, billed yearly',
    badge: 'BEST VALUE · SAVE 40%',
    features: ['Unlimited AI meal plans', 'Unlimited AI workout plans', 'Priority AI responses'],
  },
  {
    id: PRODUCTS.PLUS_MONTHLY,
    entitlement: ENTITLEMENTS.PLUS,
    name: 'Plus — Monthly',
    price: '$6.99/mo',
    sub: '7-day free trial, cancel anytime',
    features: ['Unlimited AI meal plans', 'Unlimited AI workout plans'],
  },
]

// TEMP: limit lifted for testing/dev. Set back to 3 (or final value) before
// launch to re-enable the free-tier cap. Paywall UI stays fully intact.
export const FREE_GENERATION_LIMIT = 99999

let _initialized = false

export async function initPurchases(userId) {
  if (!RC_API_KEY || !Capacitor.isNativePlatform()) return
  if (_initialized) return
  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR })
    await Purchases.configure({ apiKey: RC_API_KEY })
    if (userId) await Purchases.logIn({ appUserID: userId })
    _initialized = true
  } catch (e) {
    console.error('RevenueCat init error:', e)
  }
}

export async function getEntitlements() {
  if (!RC_API_KEY || !Capacitor.isNativePlatform()) return {}
  try {
    const { customerInfo } = await Purchases.getCustomerInfo()
    return customerInfo.entitlements.active || {}
  } catch {
    return {}
  }
}

export async function isPaidUser() {
  const active = await getEntitlements()
  return Object.keys(active).length > 0
}

export async function purchasePlan(productId) {
  const { customerInfo } = await Purchases.purchaseStoreProduct({
    product: { productIdentifier: productId },
  })
  return customerInfo
}

export async function restorePurchases() {
  const { customerInfo } = await Purchases.restorePurchases()
  return customerInfo
}
