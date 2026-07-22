export const PAGAR_ME_RATES = {
  pix: 0.0119,
  credit: {
    1: 0.0439,
    2: 0.0819,
    3: 0.0989,
    4: 0.1159,
    5: 0.1329,
    6: 0.1499,
    7: 0.1679,
    8: 0.1849,
    9: 0.2019,
    10: 0.2189,
    11: 0.2359,
    12: 0.2529,
  },
  fixed_transaction: 0.99
};

export const ORBIT_RATE = 0.10; // 10%

export type PaymentMethod = "PIX" | "CREDIT_CARD";

export interface TaxCalculationResult {
  baseValue: number;       // The total face value of the tickets
  orbitFee: number;        // The 10% Orbit fee
  pagarmeRate: number;     // The Pagar.me percentage rate used
  pagarmeFixed: number;    // The Pagar.me fixed fee (0.99)
  finalTotal: number;      // The exact total to charge the customer
  totalTaxes: number;      // finalTotal - baseValue
}

/**
 * Calculates the exact amount to charge the customer so that the platform
 * receives the expected baseValue + orbitFee clear of Pagar.me taxes.
 */
export function calculateTaxes(
  baseValue: number,
  method: PaymentMethod,
  installments: number = 1
): TaxCalculationResult {
  if (baseValue <= 0) {
    return {
      baseValue: 0,
      orbitFee: 0,
      pagarmeRate: 0,
      pagarmeFixed: 0,
      finalTotal: 0,
      totalTaxes: 0
    };
  }

  const orbitFee = baseValue * ORBIT_RATE;
  
  let pagarmeRate = 0;
  if (method === "PIX") {
    pagarmeRate = PAGAR_ME_RATES.pix;
  } else if (method === "CREDIT_CARD") {
    // Fallback to 12x rate if something is wrong
    const key = (installments >= 1 && installments <= 12 ? installments : 12) as keyof typeof PAGAR_ME_RATES.credit;
    pagarmeRate = PAGAR_ME_RATES.credit[key];
  }

  const pagarmeFixed = PAGAR_ME_RATES.fixed_transaction;

  // Formula: FinalValue = (baseValue + orbitFee + pagarmeFixed) / (1 - pagarmeRate)
  // This guarantees that: FinalValue - (FinalValue * pagarmeRate + pagarmeFixed) = baseValue + orbitFee
  const targetToReceive = baseValue + orbitFee + pagarmeFixed;
  const finalTotal = targetToReceive / (1 - pagarmeRate);

  const totalTaxes = finalTotal - baseValue;

  return {
    baseValue,
    orbitFee,
    pagarmeRate,
    pagarmeFixed,
    finalTotal,
    totalTaxes
  };
}
