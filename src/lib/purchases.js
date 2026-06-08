import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor'
import { Capacitor } from '@capacitor/core'

// Set your RevenueCat API key here once you have it from revenuecat.com
// Dashboard → Project → API Keys → Apple App Store public key (starts with appl_)
export const RC_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || ''

export const ENTITLEMENTS = {
  CORE: 'core',
  FAMILY: 'family',
  PREMIUM: 'premium',
}

export const PRODUCTS = {
  CORE: 'com.nutriq.core',
  FAMILY: 'com.nutriq.family',
  PREMIUM: 'com.nutriq.premium',
}

export const PLANS = [
  {
    id: PRODUCTS.CORE,
    entitlement: ENTITLEMENTS.CORE,
    name: 'Core',
    price: '$4.99/mo',
    features: ['Unlimited meal plans', 'Full pantry tracking', 'Recipe generation'],
  },
  {
    id: PRODUCTS.FAMILY,
    entitlement: ENTITLEMENTS.FAMILY,
    name: 'Family',
    price: '$8.99/mo',
    features: ['Everything in Core', 'Household sharing', 'Multi-user pantry'],
  },
  {
    id: PRODUCTS.PREMIUM,
    entitlement: ENTITLEMENTS.PREMIUM,
    name: 'Premium',
    price: '$12.99/mo',
    features: ['Everything in Family', 'Grocery cart ordering', 'Priority AI'],
  },
]

export const FREE_GENERATION_LIMIT = 3

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
