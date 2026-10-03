export const banknoteFields = [
  { key: "bill500", label: "Pezzi da 500 €", value: 500 },
  { key: "bill200", label: "Pezzi da 200 €", value: 200 },
  { key: "bill100", label: "Pezzi da 100 €", value: 100 },
  { key: "bill50", label: "Pezzi da 50 €", value: 50 },
  { key: "bill20", label: "Pezzi da 20 €", value: 20 },
  { key: "bill10", label: "Pezzi da 10 €", value: 10 },
  { key: "bill5", label: "Pezzi da 5 €", value: 5 },
] as const;

const ZERO = BigInt(0);
const ONE = BigInt(1);
const FIVE_EUROS = BigInt(500);

export function roundCashShare(cents: bigint): bigint {
  const absolute = cents < ZERO ? -cents : cents;
  const rounded = ((absolute + BigInt(250)) / FIVE_EUROS) * FIVE_EUROS;
  return cents < ZERO ? -rounded : rounded;
}

export function allocateBanknotes(targetCents: bigint, available: readonly bigint[]): bigint[] | null {
  if (available.length !== banknoteFields.length || available.some((count) => count < ZERO)) {
    throw new Error("Invalid banknote inventory");
  }
  if (targetCents < ZERO || targetCents % FIVE_EUROS !== ZERO) return null;

  const values = banknoteFields.map(({ value }) => BigInt(value / 5));
  const suffixTotals = Array<bigint>(values.length + 1).fill(ZERO);
  const suffixDivisors = Array<bigint>(values.length + 1).fill(ZERO);
  for (let index = values.length - 1; index >= 0; index--) {
    suffixTotals[index] = suffixTotals[index + 1] + available[index] * values[index];
    let divisor = suffixDivisors[index + 1];
    let value = available[index] > ZERO ? values[index] : ZERO;
    while (value !== ZERO) {
      [divisor, value] = [value, divisor % value];
    }
    suffixDivisors[index] = divisor;
  }

  function find(index: number, remaining: bigint): bigint[] | null {
    if (remaining === ZERO) return Array<bigint>(values.length - index).fill(ZERO);
    if (index === values.length || remaining > suffixTotals[index]) return null;
    if (remaining % suffixDivisors[index] !== ZERO) return null;

    const value = values[index];
    const maxCount = remaining / value < available[index] ? remaining / value : available[index];
    const missingFromSmaller = remaining - suffixTotals[index + 1];
    const minCount = missingFromSmaller > ZERO ? (missingFromSmaller + value - ONE) / value : ZERO;
    // Try larger denominations first, but backtrack when their remainder cannot be composed.
    for (let count = maxCount; count >= minCount; count -= ONE) {
      const smaller = find(index + 1, remaining - count * value);
      if (smaller !== null) return [count, ...smaller];
    }
    return null;
  }

  return find(0, targetCents / FIVE_EUROS);
}

export interface BanknoteExchange {
  sourceIndex: number;
  received: bigint[];
  allocation: bigint[];
}

export function suggestBanknoteExchange(
  targetCents: bigint,
  available: readonly bigint[]
): BanknoteExchange | null {
  if (allocateBanknotes(targetCents, available) !== null || targetCents < ZERO) return null;
  if (targetCents % FIVE_EUROS !== ZERO) return null;

  const values = banknoteFields.map(({ value }) => BigInt(value) * BigInt(100));
  const total = available.reduce((sum, count, index) => sum + count * values[index], ZERO);
  if (targetCents > total) return null;
  const sourceIndex = available.findIndex((count) => count > ZERO);
  if (sourceIndex < 0 || sourceIndex === banknoteFields.length - 1) return null;

  const afterExchange = [...available];
  afterExchange[sourceIndex] -= ONE;
  let remaining = targetCents;
  for (let index = 0; index < values.length; index++) {
    const count = remaining / values[index] < afterExchange[index]
      ? remaining / values[index] : afterExchange[index];
    remaining -= count * values[index];
  }

  const received = Array<bigint>(values.length).fill(ZERO);
  // Split both the payout remainder and the change so the exchange preserves the note's full value.
  for (let amount of [remaining, values[sourceIndex] - remaining]) {
    for (let index = sourceIndex + 1; index < values.length; index++) {
      received[index] += amount / values[index];
      amount %= values[index];
    }
  }
  for (let index = 0; index < values.length; index++) afterExchange[index] += received[index];
  const allocation = allocateBanknotes(targetCents, afterExchange);
  if (allocation === null) throw new Error("Banknote exchange failed to compose the payout");
  return { sourceIndex, received, allocation };
}
