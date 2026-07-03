// Marketplace money math — single source of truth. The platform charges a 10%
// fee (Stripe application_fee) and collects a 20% deposit up front. Before
// this module existed, UI surfaces showed a fabricated 12% fee / 0.88 net
// multiplier while the payment code charged 10%.

export const PLATFORM_FEE_RATE = 0.1;
export const DEPOSIT_RATE = 0.2;

// What the provider takes home from a job total after the platform fee.
export function providerNet(totalAmount: number): number {
  return totalAmount * (1 - PLATFORM_FEE_RATE);
}

export function platformFee(totalAmount: number): number {
  return totalAmount * PLATFORM_FEE_RATE;
}

export function depositAmount(totalAmount: number): number {
  return totalAmount * DEPOSIT_RATE;
}
